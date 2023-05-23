import fetchPonyfill from 'fetch-ponyfill'
import { LoginProvider, Post, PostMetadata } from '../../interface/Model'
const {fetch, Headers} = fetchPonyfill({})

let apiBase = process.env.REACT_APP_API_ENDPOINT || ""
while (apiBase.endsWith("/")) {
  apiBase = apiBase.slice(0, -1)
}

// super basic parallel request cache
class Cache {
  activeRequests: Record<string, any> = {}
  async lookup<T>(key: string, provide: () => Promise<T>): Promise<T> {
    let value = this.activeRequests[key]
    if (value !== null && value !== undefined) {
      return value
    }
    value = provide()
    .then(val => {
      delete this.activeRequests[key]
      return val
    })
    this.activeRequests[key] = value
    return value
  }
}
const cache = new Cache()

export const GetPost: (id: string) => Promise<Post> = (id) => {
    return cache.lookup('post:' + id, async (): Promise<Post> => {
      const res = await fetch(`${apiBase}/post${id}`, {
        method: 'GET',
        headers: new Headers({
          "Accept": "application/json"
        })
      })
      return await res.json() as Post
    })
}

export const ListDrafts: () => Promise<Array<PostMetadata>> = () => {
  return cache.lookup('drafts', async (): Promise<Array<Post>> => {
    return fetch(`${apiBase}/draft/`, {
      method: 'GET',
      headers: new Headers({
        'Accept': 'application/json'
      })
    })
    .then(async res => await res.json() as Array<Post>)
  })
}


export const GetDraft: (id: string) => Promise<Post> = (id) => {
  return cache.lookup('draft:' + id, async (): Promise<Post> => {
    return fetch(`${apiBase}/draft/${id}`, {
      method: 'GET',
      headers: new Headers({
        'Accept': 'application/json'
      })
    })
    .then(async res => await res.json() as Post)
  })
}

export const CreateDraft: (title: string) => Promise<Post> = (title) => {
  return cache.lookup('create-draft', async (): Promise<Post> => {
    return fetch(`${apiBase}/create-draft/`, {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json'
      }),
      body: JSON.stringify({title}),
    })
    .then(async res => await res.json() as Post)
  })
}

export const SaveDraft: (post: Post) => Promise<Post> = (post) => {
  return cache.lookup('draft:' + post.id, async (): Promise<Post> => {
    return fetch(`${apiBase}/draft/${post.id}`, {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json'
      }),
      body: JSON.stringify(post),
    })
    .then(async res => await res.json() as Post)
  })
}

export const LoginProviders: () => Promise<Array<LoginProvider>> = async () => {
  return cache.lookup('loginproviders', async (): Promise<Array<LoginProvider>> => {
    return fetch(`${apiBase}/login/providers`, {
      method: 'GET',
      headers: new Headers({
        'Accept': 'application/json'
      })
    })
    .then(async res => await res.json() as Array<LoginProvider>)
  })
}
export const LoginCallback: (authContextproviderId: string, params: Record<string, string>) => Promise<string> = async (providerId, params) => {
  return cache.lookup('logincallback', async (): Promise<string> => {
    return fetch(`${apiBase}/login/callback/${providerId}`, {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json'
      }),
      body: JSON.stringify(params)
    })
    .then(async res => await res.json())
    .then(tokenObj => {console.log('loader.ts Lambda Auth Response:: ', tokenObj); return tokenObj.access_token})
  })
}