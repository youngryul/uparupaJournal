import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth
      setIsMobile(width < MOBILE_BREAKPOINT)
    }

    // 초기 체크
    checkIsMobile()

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkIsMobile)
    
    // orientationchange 이벤트 (모바일 회전 시)
    window.addEventListener('orientationchange', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
      window.removeEventListener('orientationchange', checkIsMobile)
    }
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }

    checkIsTablet()
    window.addEventListener('resize', checkIsTablet)
    window.addEventListener('orientationchange', checkIsTablet)

    return () => {
      window.removeEventListener('resize', checkIsTablet)
      window.removeEventListener('orientationchange', checkIsTablet)
    }
  }, [])

  return isTablet
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType('mobile')
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
    window.addEventListener('orientationchange', checkDeviceType)

    return () => {
      window.removeEventListener('resize', checkDeviceType)
      window.removeEventListener('orientationchange', checkDeviceType)
    }
  }, [])

  return deviceType
}
