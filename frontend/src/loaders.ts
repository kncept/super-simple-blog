import fetchPonyfill from 'fetch-ponyfill'
import { Post } from '../../interface/Model';
const {fetch, Headers} = fetchPonyfill({});

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
      const res = await fetch(apiBase + '/post/' + id, {
        method: 'GET',
        headers: new Headers({
          "Accept": "application/json"
        })
      })
      return await res.json() as Post
    })
}

export const ListDrafts: () => Promise<Array<Post>> = () => {
  return cache.lookup('drafts', async (): Promise<Array<Post>> => {
    return fetch(apiBase + '/draft/', {
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
    return fetch(apiBase + '/draft/' + id, {
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
    return fetch(apiBase + '/create-draft/', {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json'
      }),
      body: JSON.stringify({title})
    })
    .then(async res => await res.json() as Post)
  })
}

