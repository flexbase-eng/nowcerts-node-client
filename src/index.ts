/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch'
import path from 'path'
import jwt from 'jsonwebtoken'

const PROTOCOL = 'https'
const API_HOST = 'api.nowcerts.com/api'
const API_VER = '2018-06-22'

/*
 * These are the acceptable options to the creation of the Client:
 *
 *   {
 *     host: 'api.nowcerts.com',
 *     keyInflection: 'camel',
 *     nowCertsVersion: '2018-06-22',
 *   }
 *
 * and the construction of the Client will use this data for all
 * calls made to NowCerts.
 */
export interface NowCertsOptions {
  host?: string
  keyInflection?: string
  nowCertsVersion?: string
}

type methodTypes = 'GET' | 'POST' | 'PUT' | 'DELETE'
export interface fireOpts {
  method?: methodTypes
  headers?: HeadersInit
  query?: { [index: string]: number | string | string[] | boolean }
  body?: object | object[] | FormData
}

/*
 * This is the main constructor of the NewCerts Client, and will be called
 * with something like:
 *
 *   import { NowCerts } from "nowcerts-node-client"
 *   const client = new NowCerts('[username]', '[password]', options)
 */
export class NowCerts {
  host: string
  username: string
  password: string
  nowCertsVersion: string
  token: string | undefined

  constructor (username: string, password: string, options?: NowCertsOptions) {
    this.host = options?.host ?? API_HOST
    this.nowCertsVersion = options?.nowCertsVersion ?? API_VER
    this.username = username
    this.password = password
  }

  /*
   * Function to fire off a GET, PUT, POST, (method) to the uri, preceeded
   * by the host, with the optional query params, and optional body, and
   * puts the 'apiKey' into the headers for the call, and fires off the call
   * to the nowCerts host and returns the response.
   */
  async fire(
    uri: string,
    { method = 'GET', headers, query, body }: fireOpts = {},
  ): Promise<any> {
    // build up the complete url from the provided 'uri' and the 'host'
    const url = new URL(PROTOCOL+'://'+path.join(this.host, uri))
    if (query) {
      Object.keys(query).forEach(k => {
        if (something(query[k])) {
          url.searchParams.append(k, query[k].toString())
        }
      })
    }

    // check if we have a valid token
    if (isTokenExpired(this.token)) {
      const newToken = await this.getToken()
      if (isEmpty(newToken?.token)) {
        return newToken
      }
      this.token = newToken.token
    }

    // make the appropriate headers
    headers = { ...headers,
      Accept: 'application/json',
      Authorization: `Bearer ${this.token}`,
    }

    const isForm = isFormData(body)
    if (!isForm) {
      headers = { ...headers, 'Content-Type': 'application/json' }
    }
    // allow a few retries on the authentication token expiration
    let response: any
    try {
      response = await fetch(url.toString(), {
        method,
        body: isForm ? <FormData>body : (body ? JSON.stringify(body) : undefined),
        headers,
        redirect: 'follow',
      })
      const payload = await response?.json()
      return { response, payload }
    } catch (err) {
      return { response }
    }
  }

  /*
   * Function to get an Access Token for the crentials (username and password)
   * provided in call to this client.
   */
  private async getToken(): Promise <
    { token?: string, error?: string, error_description?: string }
  > {
    return await this.fire('token', {
      method: 'POST',
      body: {
        grant_type: 'password',
        client_id: 'ngAuthApp',
        username: this.username,
        password: this.password,
      }
    })
  }
}

/*
 * Simple function used to weed out undefined and null query params before
 * trying to place them on the call.
 */
const something = (arg: any): any => {
  return arg || arg === false || arg === 0 || arg === ''
}

/*
 * Simple predicate function to return 'true' if the argument is a FormData
 * object - as that is one of the possible values of the 'body' in the fire()
 * function. We have to handle that differently on the call than when it's
 * a more traditional JSON object body.
 */
const isFormData = (arg: any): boolean => {
  let ans = false
  if (arg && typeof arg === 'object') {
    ans = (typeof arg._boundary === 'string' &&
           arg._boundary.length > 20 &&
           Array.isArray(arg._streams))
  }
  return ans
}

/*
 * Function to recursively remove all the 'empty' values from the provided
 * Object and return what's left. This will not cover the complete boolean
 * falsey set.
 */
export function removeEmpty(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(itm => removeEmpty(itm)) }
  else if (typeof obj === 'object') {
    return Object.entries(obj)
      .filter(([_k, v]) => !isEmpty(v))
      .reduce(
        (acc, [k, v]) => (
          { ...acc, [k]: v === Object(v) ? removeEmpty(v) : v }
        ), {}
      )
  }
  return obj
}

/*
 * Function to examine the argument and see if it's 'empty' - and this will
 * work for undefined values, and nulls, as well as strings, arrays, and
 * objects. If it's a regular data type - then it's "not empty" - but this
 * will help know if there's something in the data to look at.
 */
export function isEmpty(arg: any): boolean {
  if (arg === undefined || arg === null) {
    return true
  } else if (typeof arg === 'string' || Array.isArray(arg)) {
    return arg.length == 0
  } else if (typeof arg === 'object') {
    return Object.keys(arg).length == 0
  }
  return false
}

/*
 * Function to check if the JWT in the *token* param is expired.
 */
export function isTokenExpired(token: string | undefined): boolean {
  let res = true
  if (!isEmpty(token)) {
    try {
      const { exp } = jwt.decode(<string>token) as {
          exp: number;
      };
      const expirationDatetimeInSeconds = exp * 1000;
      res = Date.now() >= expirationDatetimeInSeconds;
    } catch {
      res = true
    }
  }
  return res
}
