import React, { useEffect, useReducer, useState } from 'react'
import { Post, PostMetadata } from '../../../interface/Model'
import { CreateDraft, ListDrafts } from '../loaders'
import ButtonLink from '../components/ButtonLink'
import SimpleButton from '../components/SimpleButton'
import { useNavigate } from 'react-router-dom'
import './DraftList.css'

const formReducer = (state: any, event: React.ChangeEvent<any>) => {
  return {
    ...state,
    [event.target.name]: event.target.value
  }
 }

const DraftList: React.FC = () => {
  const [drafts, setDrafts] = useState<Array<PostMetadata>>()
  const [formData, setFormData] = useReducer(formReducer, {})
  const navigate = useNavigate()

  useEffect(() => {
    if (drafts === undefined) {
      ListDrafts().then(setDrafts)
    }
  },
  [drafts])

  const createNew = (title: string) => {
    if (title === undefined || title.trim() === '') {
      console.log('enter a title')
    } else {
      CreateDraft(title.trim()).then(draft => navigate(`/drafts/${draft.id}`))
    }
  }
  
  if (drafts === undefined) {
    return <div key='loading'>
      Draft Posts Loading
    </div>
  }

  return <div>
      {drafts.map((draft, index) => {return <div key={index}>
        <form className='NewDraft'>
        <ButtonLink to={`/drafts/${draft.id}`} text='Edit Draft' />{draft.title}
        </form>
      </div>})}
      {drafts.length === 0 && <div>
        No Drafts yet
      </div>}
      {drafts.length < 5 && <div>
        <form className='NewDraft' onChange={setFormData}>
        <SimpleButton text="Draft New" onClick={() => createNew(formData.title)}/>
          <input name='title'/>
        </form>
        
      </div>}
      {drafts.length >= 5 && <div>
        Please complete a draft before starting any new ones
      </div>}

  </div>
}

export default DraftList