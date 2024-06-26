import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'

import { useLoginMutation, LoginInput } from '__generated__/graphql'
import { AppStateContext } from 'provider'
import { ErrorNotifier, SpinnerOverlay } from 'components'
import GoogleAuth from './GoogleAuth'
import {LdapLogin} from "./components";

const Login: React.FC = () => {
  const { t } = useTranslation()
  const { appSetLogin, appSetRefreshToken } = useContext(AppStateContext)
  const [login, { loading, error }] = useLoginMutation()

  const [loginInput, setLoginInput] = useState<LoginInput>({
    username: '',
    password: '',
  })
  const navigate = useNavigate()

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const { data } = await login({
        variables: {
          loginInput,
        },
      })
      if (
        data === undefined ||
        data?.login === undefined ||
        data.login?.access_token === undefined ||
        data.login?.user === undefined
      )
        throw new Error('Invalid credentials')

      appSetRefreshToken(data?.login.refresh_token || '')
      appSetLogin(data?.login.access_token!, data?.login.expires_in!, data?.login.user!)

      navigate('/')
    } catch {}
  }

  return (
    <div className="min-vh-100-nav py-3 d-flex flex-row align-items-center bg-light">
      {loading && <SpinnerOverlay transparent={true} />}
      <CContainer>
        <CRow className="justify-content-center">
          <CCol lg={8} md={12}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <h1>{t('login.title')}</h1>
                  <p className="text-medium-emphasis">{t('login.description')}</p>
                  <GoogleAuth />
                  <LdapLogin/>
                  <hr />
                  <CForm onSubmit={handleLogin}>
                    <ErrorNotifier error={error} />
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon content={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder={t('login.form.email')}
                        autoComplete="e-mail"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setLoginInput({ ...loginInput, username: event.target.value })
                        }
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon content={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder={t('login.form.password')}
                        autoComplete="current-password"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setLoginInput({ ...loginInput, password: event.target.value })
                        }
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol sm={6}>
                        <CButton type="submit" color="primary" className="px-4">
                          {t('login.form.button')}
                        </CButton>
                      </CCol>
                      {/* <CCol sm={6} className="text-left text-sm-right">
                        <CButton color="link" className="mt-2 mt-sm-0 px-0">
                          {t('login.forgot-password')}
                        </CButton>
                      </CCol> */}
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5">
                <CCardBody className="text-center">
                  <div>
                    <h2>{t('login.register.title')}</h2>
                    <p className="mx-auto" style={{ maxWidth: '200px' }}>
                      {t('login.register.description')}
                    </p>
                    <Link to="/register">
                      <CButton color="light" className="mt-3" tabIndex={-1}>
                        {t('login.register.button')}
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
