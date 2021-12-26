import React, { useEffect, useState } from 'react'
import {
  CForm,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import moment from 'moment'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toast'
import DatePicker from 'react-datepicker'

import {
  CreateReservationInput,
  DeviceWithReservationsFragment,
  useCreateReservationMutation,
} from '__generated__/graphql'
import { ButtonSave, ErrorNotifier, SpinnerOverlay } from 'components'
import { formatDeviceName } from 'utils'

interface Props {
  devices: DeviceWithReservationsFragment[]
  selectedDevice: string
  visible: boolean
  handleClose: () => void
  handleNewReservation: () => void
  reservationStart?: Date
  reservationEnd?: Date
}

const CreateReservationModal: React.FC<Props> = ({
  devices,
  selectedDevice,
  visible,
  handleClose,
  handleNewReservation,
  reservationStart,
  reservationEnd,
}: Props) => {
  const { t } = useTranslation()
  const [createReservationMutation, { loading, error, reset }] = useCreateReservationMutation()

  const [createReservationInput, setCreateReservationInput] = useState<CreateReservationInput>({
    device_id: selectedDevice,
    start: reservationStart || new Date(),
    end: reservationStart || new Date(),
  })

  useEffect(() => {
    setCreateReservationInput({
      device_id: selectedDevice,
      start: reservationStart || new Date(),
      end: reservationStart || new Date(),
    })
  }, [selectedDevice, reservationStart, reservationEnd])

  const handleCreateReservation = async (event: React.FormEvent) => {
    event.preventDefault()

    await createReservationMutation({
      variables: {
        createReservationInput: {
          ...createReservationInput,
          start: moment(createReservationInput.start).format('YYYY-MM-DD HH:mm:ss'),
          end: moment(createReservationInput.end).format('YYYY-MM-DD HH:mm:ss'),
        },
      },
    })
      .then((data) => {
        if (data.data?.createReservation) {
          toast.success(t('reservations.create.success'))
          handleClose()
          handleNewReservation()
        }
      })
      .catch((error) => {
        toast.error(t('reservations.create.error'))
      })
  }

  return (
    <>
      {loading && <SpinnerOverlay transparent={true} />}

      <CModal
        visible={visible}
        alignment="center"
        onDismiss={() => {
          handleClose()
          reset()
        }}
      >
        <CModalHeader>
          <CModalTitle>{t('reservations.create.title')}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleCreateReservation}>
          <CModalBody>
            <ErrorNotifier error={error} />
            <CFormSelect
              className="mb-3 text-center"
              aria-label="device"
              value={selectedDevice}
              disabled
            >
              {devices.map((device) => (
                <option value={device.id} key={device.id} className="text-center">
                  {formatDeviceName(device)}
                </option>
              ))}
            </CFormSelect>
            <CFormLabel>Time range </CFormLabel>&nbsp;&nbsp;
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
              <DatePicker
                selected={createReservationInput.start}
                onChange={(date: Date) =>
                  setCreateReservationInput({ ...createReservationInput, start: date })
                }
                timeInputLabel="Time:"
                dateFormat="dd.MM.yyyy | HH:mm"
                showTimeInput
                className="width-auto"
                // showTimeSelect
              />
              <span> - </span>
              <DatePicker
                selected={createReservationInput.end}
                onChange={(date: Date) =>
                  setCreateReservationInput({ ...createReservationInput, end: date })
                }
                timeInputLabel="Time:"
                dateFormat="dd.MM.yyyy | HH:mm"
                showTimeInput
                // showTimeSelect
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <ButtonSave />
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default CreateReservationModal
