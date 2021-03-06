import { genTbListFromType } from '../../src/index'


export const tbList2 = genTbListFromType<TbListModel>({
  forceLoadTbListJs: true,
})

export interface TbListModel {
  /**
   * @description 用户表a
   * @table 表实际名称user2
   */
  tb_user: User
  /**
   * @description 用户详情表a
   * @table 表实际名称userDetail2
   */
  tb_user_detail: { uid: number, age: number, address: string }
}
export type TbListModelAlias = TbListModel

export interface User {
  uid: number
  name: string
}


export * as AC from './test.config2.__built-tables'

