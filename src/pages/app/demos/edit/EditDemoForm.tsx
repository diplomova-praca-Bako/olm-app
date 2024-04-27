import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormFloating,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CFormSwitch,
} from '@coreui/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toast'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilImage } from '@coreui/icons'

import {
  ArgumentInput,
  DemoExtendedFragment,
  UpdateDemoInput,
  useDeviceTypesAndSoftwareQuery,
  useUpdateDemoMutation,
} from '__generated__/graphql'
import { ButtonBack, ButtonSave, ErrorNotifier, SpinnerOverlay } from 'components'
import { useNavigate } from 'react-router-dom'

interface Props {
  demo: DemoExtendedFragment
}

const formatDemoInput = (demo: DemoExtendedFragment) => {
  return {
    id: demo.id,
    name: demo.name,
    device_type_id: demo.deviceType.id,
    software_id: demo.software.id,
    note: demo.note,
    visible_preview: demo.visible_preview
  }
}

const EditDemoForm = ({ demo }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const deviceTypesAndSoftware = useDeviceTypesAndSoftwareQuery()
  const [updateDemoInput, setUpdateDemoInput] = useState<UpdateDemoInput>(
    formatDemoInput(demo)
  )
  const [editDemoMutation, { loading, error }] = useUpdateDemoMutation()

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault()

    await editDemoMutation({
      variables: {
        updateDemoInput,
      },
    })
      .then((data) => {
        if (data.data?.updateDemo) {
          toast.success(t('demos.update.success'))
          navigate('/app/demos/')
        }
      })
      .catch(() => {
        toast.error(t('demos.update.error'))
      })
  }

  const handleDownloadDemo = () => {
    if (!demo.demo) {
      toast.error(t('demos.download.error'))
      return
    }

    fetch(demo.demo)
      .then((response) => {
        response.blob().then((blob) => {
          const fileExt = demo.demo?.split('.').pop()
          const url = window.URL.createObjectURL(blob)
          let a = document.createElement('a')
          a.href = url
          a.download = `${demo.name}.${fileExt}`
          a.click()
          toast.success(t('demos.download.success'))
        })
      })
      .catch(() => {
        toast.error(t('demos.download.error'))
      })
  }

  return (
    <>
      <CForm onSubmit={handleEdit}>
        {(loading || deviceTypesAndSoftware.loading) && <SpinnerOverlay transparent={true} />}
        {error && <ErrorNotifier error={error} />}
        {deviceTypesAndSoftware.error && <ErrorNotifier error={deviceTypesAndSoftware.error} />}

        <CFormFloating className="mb-3">
          <CFormInput
            type="text"
            id="name"
            value={updateDemoInput.name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setUpdateDemoInput({ ...updateDemoInput, name: event.target.value })
            }
          />
          <CFormLabel>{t('demos.columns.name')}</CFormLabel>
        </CFormFloating>

        <CRow>
          <CCol sm={4}>
            <CFormLabel>{t('demos.columns.device_type')}</CFormLabel>
            <CFormSelect
              className="mb-3"
              value={updateDemoInput.device_type_id}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                event.preventDefault()
                setUpdateDemoInput({ ...updateDemoInput, device_type_id: event.target.value })
              }}
            >
              <option value="-1"></option>
              {deviceTypesAndSoftware.data?.deviceTypes.map((deviceType) => (
                <option value={deviceType.id} key={deviceType.id}>
                  {deviceType.name}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol sm={4}>
            <CFormLabel>{t('demos.columns.software')}</CFormLabel>
            <CFormSelect
              className="mb-3"
              value={updateDemoInput.software_id}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                event.preventDefault()
                setUpdateDemoInput({ ...updateDemoInput, software_id: event.target.value })
              }}
            >
              <option value="-1"></option>
              {deviceTypesAndSoftware.data?.software.map((software) => (
                <option value={software.id} key={software.id}>
                  {software.name}
                </option>
              ))}
            </CFormSelect>
          </CCol>
        </CRow>

        <CFormFloating className="mb-3">
          <CFormTextarea
            id="note"
            value={updateDemoInput.note || ''}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setUpdateDemoInput({ ...updateDemoInput, note: event.target.value })
            }
            style={{ height: '6rem' }}
          ></CFormTextarea>
          <CFormLabel>{t('demos.columns.note')}</CFormLabel>
        </CFormFloating>

        <CRow>
          <CCol md={8}>
            <CFormLabel>{t('demos.columns.demo')}</CFormLabel>
            <div className="mb-3 d-flex align-items-end">
              <div>
                <CFormInput
                  type="file"
                  id="demo"
                  onChange={({ target: { validity, files } }) => {
                    if (validity.valid)
                      setUpdateDemoInput({ ...updateDemoInput, demo: files ? files[0] : null })
                  }}
                />
              </div>
              <div className="me-3">
                {demo.demo && (
                  <CButton
                    color="success"
                    className="ms-2 d-inline-flex justify-content-center align-items-center text-light"
                    type="button"
                    onClick={handleDownloadDemo}
                  >
                    <CIcon content={cilCloudDownload} />
                    <span className="ms-1 text-nowrap">{demo.demo.split('/').pop()}</span>
                  </CButton>
                )}
              </div>
              <div>
                <CFormSwitch 
                  id="visible_preview" 
                  label={t('demos.columns.visible_preview')}
                  size="xl"
                  checked={updateDemoInput.visible_preview || false}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setUpdateDemoInput({ ...updateDemoInput, visible_preview: event.target.checked })
                  }
                />
              </div>
            </div>
          </CCol>
        </CRow>

        <div className="text-right">
          <ButtonBack className="me-2" />
          {updateDemoInput.device_type_id !== '-1' && (<ButtonSave />)}
        </div>
      </CForm>
    </>
  )
}

export default EditDemoForm