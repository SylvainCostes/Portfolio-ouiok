import './BottomNavigationBar.css'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { Briefcase } from '../icons/Briefcase'
import { ChatTeardropDots } from '../icons/ChatTeardrop'
import { Globe } from '../icons/Globe'
import { HandPalm } from '../icons/HandPalm'
import { HandWaving } from '../icons/HandWaving'
import { Dock, DockIcon } from '../ui/dock'
import useScrollHandler from './useScrollHandler'
import { useTooltipHandler } from './useTooltipHandler'

export const bottomNavigationItems = [
  {
    name: 'Hi 👋',
    icon: HandWaving,
    href: '/',
    viewTransitionName: 'home'
  },
  {
    name: 'Projects',
    icon: Briefcase,
    href: '/projects',
    viewTransitionName: 'projects'
  },
  {
    name: 'Blog',
    icon: ChatTeardropDots,
    href: '/blog',
    viewTransitionName: 'blog'
  },
  {
    name: 'About',
    icon: HandPalm,
    href: '/about',
    viewTransitionName: 'about'
  },
] as const

const BottomNavigationBar = () => {
  const [currentPath, setCurrentPath] = useState('')
  const firstSegment = '/' + (currentPath.split('/').filter(Boolean)[0] ?? '')

  const isLangFr = currentPath.startsWith('/fr')
  const langHref = isLangFr
    ? currentPath.replace(/^\/fr/, '') || '/'
    : '/fr' + currentPath

  const navRef = useRef<HTMLDivElement>(null)

  const { handleScroll, setInitialPosition } = useScrollHandler(navRef)
  const { setupTooltip } = useTooltipHandler(navRef)

  const handlePathChange = () => {
    // hide the tooltip when the page is loaded
    const tip = document.querySelector<HTMLDivElement>('.tip')
    tip?.style.setProperty('--show', '0')
  }

  useEffect(() => {
    setCurrentPath(window.location.pathname)

    document.addEventListener('astro:page-load', () => {
      handlePathChange()
      setCurrentPath(window.location.pathname)
    })
    document.addEventListener('local-navigation', (e) => {
      setCurrentPath((e as CustomEvent).detail.path)
    })
    window.addEventListener('scroll', handleScroll)

    setInitialPosition()
    setupTooltip()

    return () => {
      document.removeEventListener('astro:page-load', handlePathChange)
      window.removeEventListener('scroll', handleScroll)
    }  }, [])

  return (
    <>
      <div
        id='nav-container'
        ref={navRef}
        className={cn('nav', 'fixed z-10')}
        style={{ bottom: 'var(--bottom-nav-bar-offset)' }}
      >
        <nav
          onPointerMove={() => {
            // remove the css variable which force tooltip to be hidden
            const tip = document.querySelector<HTMLDivElement>('.tip')
            tip?.style.removeProperty('--show')
          }}
          className={cn(
            'mx-auto overflow-hidden rounded-[32px]',
            'border border-shark-950',
            'w-fit bg-black transition-all duration-300'
          )}
        >
          <div id='bottom-nav-bar-upper' className='w-full'></div>
          <Dock>
            <li id='bottom-nav-bar-leading'></li>
            {bottomNavigationItems.map(
              ({ name, icon: Icon, href, ...item }) => (
                <DockIcon
                  key={name}
                  name={item.viewTransitionName}
                  href={href}
                  onClick={() => setCurrentPath(href)}
                  aria-label={name}
                >
                  <Icon className='size-5' />
                  {firstSegment === href && (
                    <div className='absolute bottom-[3px] size-[3.5px] rounded-full bg-emerald-300'></div>
                  )}
                </DockIcon>
              )
            )}
            <li className='mx-1 h-5 w-px self-center rounded-full bg-zinc-700' aria-hidden='true' />
            <DockIcon
              name='lang'
              href={langHref}
              aria-label={isLangFr ? 'Switch to English' : 'Passer en Français'}
            >
              <Globe className='size-4 shrink-0' />
              <span className='absolute right-[3px] top-[3px] text-[7px] font-bold leading-none text-emerald-400'>
                {isLangFr ? 'FR' : 'EN'}
              </span>
            </DockIcon>
          </Dock>
        </nav>
      </div>
      <div className='tip' aria-hidden='true'>
        <div className='tip__track'>
          <div />
          {bottomNavigationItems.map(({ name }) => (
            <div key={name}>{name}</div>
          ))}
          <div>{isLangFr ? '-> English' : '-> Français'}</div>
        </div>
      </div>
    </>
  )
}

export default BottomNavigationBar
