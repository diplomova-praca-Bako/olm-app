import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { cilPencil, cilTrash } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { TableAction, TableColumn } from '../../../../types'
import { Role, useDeleteRoleMutation } from '../../../../__generated__/graphql'
import { ErrorNotifier, TableList } from '../../../components'

interface Props {
  roles: Role[]
  refetch: any
}

const IndexRoleTable: React.FC<Props> = ({ roles, refetch }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleteRoleMutation, { error }] = useDeleteRoleMutation()

  const handleDeleteUser = async (id: string) => {
    let response = window.confirm(t('users.delete.confirm'))
    if (response) {
      await deleteRoleMutation({
        variables: { id },
      })
        .then(refetch)
        .catch(() => {})
    }
  }

  const columns: TableColumn[] = [
    {
      column: 'id',
      name: t('roles.columns.id'),
      style: { width: '80px' },
    },
    {
      column: 'name',
      name: t('roles.columns.name'),
    },
  ]

  const actions: TableAction[] = [
    {
      color: 'primary',
      icon: <CIcon content={cilPencil} />,
      handleClick: (id: string) => {
        navigate(`/app/roles/${id}/edit`)
      },
    },
    {
      color: 'danger',
      textColor: 'light',
      icon: <CIcon content={cilTrash} />,
      handleClick: handleDeleteUser,
    },
  ]

  if (error) return <ErrorNotifier error={error} />

  return <TableList columns={columns} data={roles} actions={actions} />
}

export default IndexRoleTable
