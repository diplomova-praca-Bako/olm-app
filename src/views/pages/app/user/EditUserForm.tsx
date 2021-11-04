import React, { useState } from 'react'
import { CForm, CFormFloating, CFormInput, CFormLabel } from '@coreui/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toast'
import { UpdateUserInput, useEditUserMutation, User } from '../../../../__generated__/graphql'
import { ButtonSave, ErrorNotifier, SpinnerOverlay } from '../../../components'

interface Props {
  user: User
  handleUpdateUser?: (user: User) => void
}

const EditUserForm: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation()
  const [updateUserInput, setUpdateUserInput] = useState<UpdateUserInput>({
    id: props.user.id,
    name: props.user.name,
    email: props.user.email,
  })
  const [editUserMutation, { loading, error }] = useEditUserMutation()

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault()

    await editUserMutation({
      variables: {
        updateUserInput,
      },
    })
      .then((data) => {
        if (data.data?.updateUser) {
          toast.success(t('users.update.success'))
          if(props.handleUpdateUser) {
            props.handleUpdateUser(data.data.updateUser)
          }
        }
      })
      .catch(() => {})
  }

  return (
    <CForm onSubmit={handleEdit}>
      {loading ? <SpinnerOverlay transparent={true} /> : <></>}
      <ErrorNotifier error={error} />
      <CFormFloating className="mb-3">
        <CFormInput
          type="text"
          id="name"
          value={updateUserInput.name || ''}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setUpdateUserInput({ ...updateUserInput, name: event.target.value })
          }
        />
        <CFormLabel>{t('users.columns.name')}</CFormLabel>
      </CFormFloating>

      <CFormFloating className="mb-3">
        <CFormInput
          type="email"
          id="email"
          value={updateUserInput?.email || ''}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setUpdateUserInput({ ...updateUserInput, email: event.target.value })
          }
        />
        <CFormLabel>{t('users.columns.email')}</CFormLabel>
      </CFormFloating>
      <div className="text-right">
        <ButtonSave />
      </div>
    </CForm>
  )
}

export default EditUserForm
