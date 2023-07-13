import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../models/User";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery, createPaginationResult } from "../helpers/pagination";

@Injectable()
export class UserQueryRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>){}
  async getUsers(params: QueryParamsModel): Promise<Paginator<User>> {
    //
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    //
    const search : any = {}
    if(query.searchLoginTerm != null){
        search.login = {$regex: query.searchLoginTerm, $options: 'i'}
    }
    if(query.searchEmailTerm != null){
        search.email = {$regex: query.searchEmailTerm, $options: 'i'}
    }
    const searchTermsArray = Object.keys(search).map(key => ({ [key]: search[key] }))
    const users = await this.userModel.find({$or: searchTermsArray.length === 0 ? [{}] : searchTermsArray}, { password: false, confirmationEmail: false, confirmationPassword: false, __v: false })
    .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    .skip(skip).limit(query.pageSize).lean()
    //
    const transformedUsers = users.map((user) => {
      const { _id, ...rest } = user
      const id = _id.toString()
      return { id, ...rest }
    })

    const count = await this.userModel.countDocuments({$or: searchTermsArray.length === 0 ? [{}] : searchTermsArray})
    const result = createPaginationResult(count, query, transformedUsers)
    
    return result
  }
}