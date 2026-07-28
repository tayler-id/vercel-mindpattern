import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AlertCircle, MoreHorizontal } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Alert, AlertAction, AlertDescription, AlertTitle } from './alert'
import { Badge, badgeVariants } from './badge'
import { Button, buttonVariants } from './button'
import { Input } from './input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'
import { Separator } from './separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './sidebar'
import { Skeleton } from './skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from './tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

vi.mock('@base-ui/react/dialog', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const primitive = (tag: string) =>
    function Primitive({
      children,
      render,
      open: _open,
      onOpenChange: _onOpenChange,
      ...props
    }: Record<string, unknown>) {
      void [_open, _onOpenChange]
      if (React.isValidElement(render)) return React.cloneElement(render, props, children)
      return React.createElement(tag, props, children)
    }

  return {
    Dialog: {
      Root: primitive('div'),
      Trigger: primitive('button'),
      Portal: primitive('div'),
      Close: primitive('button'),
      Backdrop: primitive('div'),
      Popup: primitive('div'),
      Title: primitive('h2'),
      Description: primitive('p'),
    },
  }
})

vi.mock('@base-ui/react/merge-props', () => ({
  mergeProps: (...props: Record<string, unknown>[]) => Object.assign({}, ...props),
}))

vi.mock('@base-ui/react/select', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const primitive = (tag: string) =>
    function Primitive({
      children,
      render,
      value: _value,
      onValueChange: _onValueChange,
      side: _side,
      sideOffset: _sideOffset,
      align: _align,
      alignOffset: _alignOffset,
      alignItemWithTrigger: _alignItemWithTrigger,
      ...props
    }: Record<string, unknown>) {
      void [
        _value,
        _onValueChange,
        _side,
        _sideOffset,
        _align,
        _alignOffset,
        _alignItemWithTrigger,
      ]
      if (React.isValidElement(render)) return React.cloneElement(render, props, children)
      return React.createElement(tag, props, children)
    }

  return {
    Select: {
      Root: primitive('div'),
      Group: primitive('div'),
      Value: primitive('span'),
      Trigger: primitive('button'),
      Icon: primitive('span'),
      Portal: primitive('div'),
      Positioner: primitive('div'),
      Popup: primitive('div'),
      List: primitive('div'),
      GroupLabel: primitive('div'),
      Item: primitive('button'),
      ItemText: primitive('span'),
      ItemIndicator: primitive('span'),
      Separator: primitive('hr'),
      ScrollUpArrow: primitive('div'),
      ScrollDownArrow: primitive('div'),
    },
  }
})

vi.mock('@base-ui/react/tabs', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const primitive = (tag: string) =>
    function Primitive({
      children,
      value: _value,
      defaultValue: _defaultValue,
      orientation: _orientation,
      ...props
    }: Record<string, unknown>) {
      void [_value, _defaultValue, _orientation]
      return React.createElement(tag, props, children)
    }

  return {
    Tabs: {
      Root: primitive('div'),
      List: primitive('div'),
      Tab: primitive('button'),
      Panel: primitive('div'),
    },
  }
})

vi.mock('@base-ui/react/tooltip', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const primitive = (tag: string) =>
    function Primitive({
      children,
      render,
      delay: _delay,
      side: _side,
      sideOffset: _sideOffset,
      align: _align,
      alignOffset: _alignOffset,
      hidden: _hidden,
      ...props
    }: Record<string, unknown>) {
      void [_delay, _side, _sideOffset, _align, _alignOffset, _hidden]
      if (React.isValidElement(render)) return React.cloneElement(render, props, children)
      return React.createElement(tag, props, children)
    }

  return {
    Tooltip: {
      Provider: primitive('div'),
      Root: primitive('div'),
      Trigger: primitive('button'),
      Portal: primitive('div'),
      Positioner: primitive('div'),
      Popup: primitive('div'),
      Arrow: primitive('span'),
    },
  }
})

vi.mock('@base-ui/react/use-render', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  return {
    useRender: ({
      defaultTagName,
      props,
      render,
      state,
    }: {
      defaultTagName: string
      props: Record<string, unknown>
      render?: React.ReactElement
      state?: Record<string, unknown>
    }) => {
      const stateProps = Object.fromEntries(
        Object.entries(state ?? {})
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [`data-${key}`, String(value)]),
      )
      if (React.isValidElement(render)) return React.cloneElement(render, { ...stateProps, ...props }, props.children)
      return React.createElement(defaultTagName, { ...stateProps, ...props }, props.children)
    },
  }
})

function SidebarState() {
  const { state } = useSidebar()
  return <span data-testid="sidebar-state">{state}</span>
}

describe('ui wrapper components', () => {
  it('renders static wrappers, primitive slots, and variants', () => {
    const { container } = render(
      <>
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Alert title</AlertTitle>
          <AlertDescription>Alert body</AlertDescription>
          <AlertAction>Alert action</AlertAction>
        </Alert>
        <Badge variant="outline">Badge</Badge>
        <Button size="sm" variant="outline">
          Button
        </Button>
        <Input aria-label="Input" className="custom-input" />
        <Separator orientation="vertical" />
        <Skeleton className="custom-skeleton" />
        <Tabs orientation="vertical" defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">Tab A</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Panel A</TabsContent>
        </Tabs>
        <TooltipProvider delay={5}>
          <Tooltip>
            <TooltipTrigger>Hover target</TooltipTrigger>
            <TooltipContent side="bottom">Tooltip body</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Alert title')
    expect(screen.getByText('Badge')).toHaveAttribute('data-slot', 'badge')
    expect(screen.getByText('Button')).toHaveAttribute('data-slot', 'button')
    expect(screen.getByLabelText('Input')).toHaveClass('custom-input')
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument()
    expect(container.querySelector('.custom-skeleton')).toHaveAttribute('data-slot', 'skeleton')
    expect(screen.getByText('Panel A')).toHaveAttribute('data-slot', 'tabs-content')
    expect(screen.getByText('Tooltip body')).toHaveAttribute('data-slot', 'tooltip-content')
    expect(badgeVariants({ variant: 'destructive' })).toContain('text-white')
    expect(buttonVariants({ variant: 'ghost', size: 'icon-sm' })).toContain('size-7')
    expect(tabsListVariants({ variant: 'line' })).toContain('bg-transparent')
  })

  it('renders sheet and select compositions', () => {
    const { container } = render(
      <>
        <Sheet open>
          <SheetTrigger>Open sheet</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Sheet title</SheetTitle>
              <SheetDescription>Sheet description</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>Close sheet</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Sheet open>
          <SheetContent showCloseButton={false}>No sheet close</SheetContent>
        </Sheet>
        <Select value="one">
          <SelectTrigger size="sm">
            <SelectValue>One</SelectValue>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            <SelectGroup>
              <SelectLabel>Group label</SelectLabel>
              <SelectItem value="one">One</SelectItem>
              <SelectSeparator />
              <SelectItem value="two">Two</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </>,
    )

    expect(screen.getByText('Sheet title')).toHaveAttribute('data-slot', 'sheet-title')
    expect(screen.getByText('No sheet close')).toHaveAttribute('data-slot', 'sheet-content')
    expect(screen.getAllByText('One').length).toBeGreaterThan(0)
    expect(screen.getByText('Group label')).toHaveAttribute('data-slot', 'select-label')
    expect(container.querySelector('[data-side="left"]')).toBeInTheDocument()
  })

  it('renders sidebar desktop states and exported subcomponents', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    render(
      <SidebarProvider defaultOpen>
        <SidebarState />
        <Sidebar side="right" variant="floating" collapsible="icon">
          <SidebarHeader>Header</SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Group</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Group action">
                <MoreHorizontal />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarInput aria-label="Sidebar input" />
                <SidebarSeparator />
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Tooltip label" isActive size="lg">
                      Menu button
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover>Act</SidebarMenuAction>
                    <SidebarMenuBadge>7</SidebarMenuBadge>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="/child" isActive size="sm">
                          Child
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <Sidebar collapsible="none">Always visible</Sidebar>
        <SidebarInset>Inset content</SidebarInset>
        <SidebarTrigger />
      </SidebarProvider>,
    )

    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('expanded')
    fireEvent.click(screen.getAllByRole('button', { name: 'Toggle Sidebar' }).at(-1)!)
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('collapsed')
    expect(document.cookie).toContain('sidebar_state=false')
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('expanded')
    expect(screen.getByText('Always visible')).toHaveAttribute('data-slot', 'sidebar')
    expect(screen.getByText('Inset content')).toHaveAttribute('data-slot', 'sidebar-inset')
  })

  it('renders sidebar mobile sheet branch and enforces provider usage', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 })
    const { container } = render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Mobile sidebar</SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    )

    await waitFor(() => expect(container.querySelector('[data-mobile="true"]')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
    expect(screen.getByText('Mobile sidebar')).toBeInTheDocument()

    function OutsideProvider() {
      useSidebar()
      return null
    }

    expect(() => render(<OutsideProvider />)).toThrow('useSidebar must be used within a SidebarProvider.')
  })

  it('uses controlled sidebar open state when provided', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    const setOpen = vi.fn()

    render(
      <SidebarProvider open onOpenChange={setOpen}>
        <SidebarTrigger />
      </SidebarProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
    expect(setOpen).toHaveBeenCalledWith(false)
  })
})
