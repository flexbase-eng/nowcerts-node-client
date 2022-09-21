/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmpty, NowCerts } from './'

export interface GetInsuredsOptions {
  id?: string
  properties?: string[]
  filters?: string[][]
  orderBy?: string
}

export interface AgentInfo {
  databaseId?: string
  firstName?: string
  lastName?: string
}

export interface DateAndLineOfBusinessInfo {
  xdate?: Date
  lineOfBusinessName?: string
}

type InsuredType = 0 | 1
type TruckingCompanyProspectType = 0 | 1 | 2
export interface InsuredInfo {
  id?: string
  commercialName?: string
  firstName?: string
  middleName?: string
  lastName?: string
  dateOfBirth?: Date
  type?: InsuredType
  dba?: string
  addressLine1?: string
  addressLine2?: string
  state?: string
  city?: string
  zipCode?: string
  eMail?: string
  eMail2?: string
  eMail3?: string
  fax?: string
  phone?: string
  cellPhone?: string
  smsPhone?: string
  description?: string
  active?: boolean
  website?: string
  fein?: string
  customerId?: string
  insuredId?: string
  referralSourceCompanyName?: string
  changeDate?: Date
  agents: AgentInfo[]
  csRs: AgentInfo[]
  xDatesAndLinesOfBusiness: DateAndLineOfBusinessInfo[]
  insuredContacts: any[]
  policies: any[]
  createDate?: Date
  agencyLocation: any[]
  coInsuredFirstName?: string
  coInsuredMiddleName?: string
  coInsuredLastName?: string
  coInsuredDateOfBirth?: Date
  insuredType?: Date
  appliedTags: any[]
  prospectType?: TruckingCompanyProspectType
  claims: any[]
  acquisitionDate?: Date
}

export class InsuredApi {
  client: NowCerts;

  constructor(client: NowCerts) {
    this.client = client
  }

  /*
   * Function to get the insured list. This methos can be used to customize the
   * query adding the collection of data to be returned and the filters to be
   * applied in the query. The full documentation to use this method is in this
   * can be found at this link:
   * https://nowcerts.freshdesk.com/en/support/solutions/articles/48000146941-nowcerts-com-rest-api-search-insureds
   */
  async get(options?: GetInsuredsOptions): Promise<InsuredInfo[]> {
    let uri = `InsuredList(${options?.id ? options.id : ''})?`

    // add the properties to be returned by the query
    if (!isEmpty(options?.properties)) {
      uri += '$select=' + (options?.properties ?? []).join(',')
    }

    // add the filters
    if (!isEmpty(options?.filters)) {
      uri += '$filter=' + (options?.filters ?? []).reduce(
        (acc, curr) => acc + curr.join(' eq ')+',',
        ''
      )
    }
    
    const resp = await this.client.fire(uri)
    return resp
  }
}
