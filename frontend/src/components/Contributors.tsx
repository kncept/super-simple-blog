import React from 'react'
import './HBox.css'
import { Contributor } from '../../../interface/Model'

type Props = {
    contributors: Array<Contributor>
}

const Contributors: React.FC<Props> = ({contributors}) => {
    if (contributors.length === 0) {
        return <div className='contributors'>
            <span>Anonymous</span>
        </div>
    }
    return <div className='contributors'>
        {contributors.map(contributor => <span key={contributor.id}>Author: {contributor.name}</span>)}
    </div>
}

export default Contributors