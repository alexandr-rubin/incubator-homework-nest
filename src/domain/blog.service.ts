import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Mongoose } from "mongoose";
import { Blog, BlogDocument, BlogInputModel, BlogViewModel } from "../models/Blogs";
import { Post, PostDocument, PostInputModel, PostViewModel } from "../models/Post";
import { BlogQueryRepository } from "../queryRepositories/blog.query-repository";

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>, @InjectModel(Post.name) private postModel: Model<PostDocument>, private blogQueryRepository: BlogQueryRepository){}

  async addBlog(blog: BlogInputModel): Promise<BlogViewModel>{
    const newBlog = new this.blogModel({id: new mongoose.Types.ObjectId().toString(), ...blog, createdAt: new Date().toISOString(), isMembership: false})
    const save = (await newBlog.save()).toJSON()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __v, _id, ...result } = save
    return result
  }

  async addPostForSpecificBlog(blogId: string, post: PostInputModel): Promise<PostViewModel | null>{
    const blog = await this.blogQueryRepository.getBlogById(blogId)
    if(!blog){
      return null
    }
    const newPost = new this.postModel({id: new mongoose.Types.ObjectId().toString(), ...post, blogId: blogId, blogName: blog.name, createdAt: new Date().toISOString(),
    extendedLikesInfo: { likesCount: 0, dislikesCount: 0}})
    const save = (await newPost.save()).toJSON()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __v, _id, ...result } = {...save, extendedLikesInfo: { likesCount: 0, dislikesCount: 0, myStatus: 'None', newestLikes: [/*{ addedAt: '', login: '', userId: ''}*/]}}
    return result
  }

  async deleteBlogById(id: string): Promise<boolean> {
    const result = await this.blogModel.findByIdAndDelete(id)
    return !!result
  }

  async updateBlogById(id: string, blog: BlogInputModel): Promise<boolean> {
    const result = await this.blogModel.findByIdAndUpdate(id, blog)
    return !!result
  }

  async deleteBlogsTesting(): Promise<boolean> {
    const result = await this.blogModel.deleteMany({})
    return !!result
  }
}