import { Post, PostMetadata } from "../../../interface/Model"
import { FileOperations } from "./filesystem-storage"
import { parse, stringify} from '@supercharge/json'
import * as path from 'path'

export default interface Storage {
    readyFlag: Promise<any>
    
    PostStorage(): PostReader
    DraftStorage(): PostCreator

}

export interface PostReader {
    ListPosts(): Promise<Array<PostMetadata>> // TODO: some pagination thingy
    GetPost(postId: string): Promise<Post>
    GetMediaRef(postId: string, filename: string): Promise<string>
    GetMedia(postId: string, filename: string): Promise<Buffer>
}

export interface PostCreator extends PostReader{
    AddMedia(postId: string, filename: string, data: Buffer): Promise<void>
    Save(post: Post): Promise<void> // update only
    PublishDraft(postId: string): Promise<void>
}

export class FilesystemStorage implements Storage {
    fsBackend: FileOperations
    draftStorageLocation: string
    postStorageLocation: string
    readyFlag: Promise<any>
    constructor(storageLocation: string, fsBackend: FileOperations) {
        this.fsBackend = fsBackend
        this.draftStorageLocation = path.join(storageLocation, 'draft')
        this.postStorageLocation = path.join(storageLocation, 'post')
        this.readyFlag = Promise.all([
            this.fsBackend.mkdir(this.draftStorageLocation),
            this.fsBackend.mkdir(this.postStorageLocation),
        ])
        
    }
    
    PostStorage(): PostReader {
        return new FileSystemPostReader(this.postStorageLocation, this.fsBackend)
    }

    DraftStorage(): PostCreator {
        return new FileSystemPostCreator(this.draftStorageLocation, this.fsBackend)
    }
}

class FileSystemPostReader implements PostReader {
    storageLocation: string
    fsBackend: FileOperations
    constructor(storageLocation: string, fsBackend: FileOperations) {
        this.storageLocation = storageLocation
        this.fsBackend = fsBackend
    }
    ListPosts(): Promise<PostMetadata[]> {
        return new Promise(async (resolve, reject) => {
            const posts: Array<PostMetadata> = []
            const postPromises = await this.fsBackend.list(this.storageLocation)
            .then(ids => {
                // PostMetadata
                return ids.map((postId, index) => {
                    const postPath = this.calculatePostPath(postId)
                    return this.fsBackend.read(path.join(postPath, 'post.json'))
                        .then(postData => posts[index] = parse(postData.toString()) as PostMetadata)
                })
            })
            Promise.all(postPromises).then(() => resolve(posts))
        })
    }

    GetPost(postId: string): Promise<Post> {
        const postPath = this.calculatePostPath(postId)
        return new Promise(async (resolve, reject) => {
            const markdown = await this.fsBackend.read(path.join(postPath, 'post.md'))
            const postMetaBuffer = await this.fsBackend.read(path.join(postPath, 'post.json'))
            const postMeta = parse(postMetaBuffer.toString()) as PostMetadata
            resolve({...postMeta, markdown: markdown.toString()})
        })
    }
    GetMediaRef(postId: string, filename: string): Promise<string> {
        throw new Error('Method not implemented.')
    }
    GetMedia(postId: string, filename: string): Promise<Buffer> {
        const postPath = this.calculatePostPath(postId)
        return this.fsBackend.read(path.join(postPath, filename))
        // const postPath = this.calculatePostPath(post.id)
        throw new Error('Method not implemented.')
    }

    calculatePostPath(postId: string): string {
        return path.join(this.storageLocation, postId)
    }
}

class FileSystemPostCreator extends FileSystemPostReader implements PostCreator {
    constructor(storageLocation: string, fsBackend: FileOperations) {
        super(storageLocation, fsBackend)
    }
    PublishDraft(postId: string): Promise<void> {
        throw new Error('Method not implemented.')
    }
    AddMedia(postId: string, filename: string, data: Buffer): Promise<void> {
        if (filename.toLowerCase() === 'post.json' || filename.toLowerCase() === 'post.md') {
            return Promise.reject()
        }
        const postPath = this.calculatePostPath(postId)
        return this.fsBackend.read(path.join(postPath, 'post.json')).then(async postJson => {
            await this.fsBackend.write(path.join(postPath, filename), data)
            const post = parse(postJson.toString()) as PostMetadata
            post.attachments.push(filename)
            await this.fsBackend.write(path.join(postPath, 'post.json'), stringify(post))
        })
    }
    Save(post: Post): Promise<void> {
        const postPath = this.calculatePostPath(post.id)
        return this.fsBackend.mkdir(postPath).then(async () => {
            await this.fsBackend.write(path.join(postPath, 'post.json'), stringify(extractMetadata(post)))
            await this.fsBackend.write(path.join(postPath, 'post.md'), post.markdown)
        })
    }
}

function extractMetadata(post: Post): PostMetadata {
    return {
        attachments: post.attachments,
        contributors: post.contributors,
        id: post.id,
        title: post.title,
        updatedTs: post.updatedTs,
    }
}
