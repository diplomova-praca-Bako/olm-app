import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { AppSidebar, AppHeader } from './components'

const DefaultLayout: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true)

  const changeSidebarVisibility = () => {
    setSidebarVisible(!sidebarVisible);
      setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
      }, 500);
  }

  return (
    <div>
      <AppSidebar visible={sidebarVisible} />
      <div className="wrapper d-flex flex-column min-vh-100 bg-light">
        <AppHeader changeSidebarVisibility={changeSidebarVisibility} />
        <div className="body flex-grow-1 px-3 mb-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DefaultLayout
