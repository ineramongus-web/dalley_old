export interface UDim2 {
  X: { Scale: number; Offset: number }
  Y: { Scale: number; Offset: number }
}

export interface Vector2 {
  X: number
  Y: number
}

export interface Color3 {
  R: number
  G: number
  B: number
}

export type RobloxElementType = 'Frame' | 'TextLabel' | 'TextButton' | 'ImageLabel' | 'ImageButton' | 'ScrollingFrame' | 'TextBox' | 'ViewportFrame'

export interface UIElementFunction {
  id: string
  eventName: string
  animationId: string
  enabled: boolean
}

export interface UIListLayout {
  FillDirection: 'Horizontal' | 'Vertical'
  SortOrder: 'Name' | 'LayoutOrder' | 'Custom'
  HorizontalAlignment: 'Left' | 'Center' | 'Right'
  VerticalAlignment: 'Top' | 'Center' | 'Bottom'
  Padding: { Scale: number; Offset: number }
  Wraps: boolean
}

export interface UIGridLayout {
  FillDirection: 'Horizontal' | 'Vertical'
  SortOrder: 'Name' | 'LayoutOrder' | 'Custom'
  HorizontalAlignment: 'Left' | 'Center' | 'Right'
  VerticalAlignment: 'Top' | 'Center' | 'Bottom'
  CellPadding: UDim2
  CellSize: UDim2
  StartCorner: 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight'
}

export interface UIElement {
  id: string
  type: RobloxElementType
  name: string
  parent?: string
  visible?: boolean
  locked?: boolean
  children?: UIElement[]
  functions?: UIElementFunction[]
  // SIMPLE ROBLOX COORDINATE SYSTEM - PIXEL BASED
  position: { x: number; y: number }  // Absolute pixels relative to parent's top-left
  size: { width: number; height: number }  // Size in pixels
  properties: {
    Position?: UDim2  // Keep for export compatibility
    Size?: UDim2      // Keep for export compatibility
    AnchorPoint?: Vector2
    BackgroundColor3?: Color3
    BackgroundTransparency?: number
    BorderColor3?: Color3
    BorderSizePixel?: number
    ClipsDescendants?: boolean
    Visible?: boolean
    ZIndex?: number
    Rotation?: number
    Text?: string
    TextColor3?: Color3
    TextSize?: number
    TextXAlignment?: 'Left' | 'Center' | 'Right'
    TextYAlignment?: 'Top' | 'Center' | 'Bottom'
    TextScaled?: boolean
    TextWrapped?: boolean
    TextTruncate?: 'None' | 'AtEnd' | 'AtMiddle' | 'AtStart' | 'SplitWord'
    Font?: 'Legacy' | 'Arial' | 'ArialBold' | 'SourceSans' | 'SourceSansBold' | 'SourceSansSemibold' | 'SourceSansLight' | 'SourceSansItalic' | 'Bodoni' | 'Garamond' | 'Cartoon' | 'Code' | 'Highway' | 'SciFi' | 'Arcade' | 'Fantasy' | 'Antique' | 'Gotham' | 'GothamSemibold' | 'GothamBold' | 'GothamBlack' | 'AmaticSC' | 'Bangers' | 'Creepster' | 'DenkOne' | 'Fondamento' | 'FredokaOne' | 'GrenzeGotisch' | 'IndieFlower' | 'JosefinSans' | 'Jura' | 'Kalam' | 'LuckiestGuy' | 'Merriweather' | 'Michroma' | 'Nunito' | 'Oswald' | 'PatrickHand' | 'PermanentMarker' | 'Roboto' | 'RobotoCondensed' | 'RobotoMono' | 'Sarpanch' | 'SpecialElite' | 'TitilliumWeb' | 'Ubuntu'
    Image?: string
    ImageColor3?: Color3
    ImageTransparency?: number
    ScaleType?: 'Stretch' | 'Slice' | 'Tile' | 'Fit' | 'Crop'
    UICorner?: { CornerRadius: { Scale: number; Offset: number } }
    UIStroke?: Array<{ 
      Color: Color3
      Thickness: number
      Transparency: number
      StrokeSizingMode?: 'FixedSize' | 'ScaledSize'
      BorderOffset?: { Scale: number; Offset: number }
      UIGradient?: {
        Color: {
          Keypoints: Array<{
            Time: number
            Value: Color3
          }>
        }
        Transparency: {
          Keypoints: Array<{
            Time: number
            Value: number
          }>
        }
        Rotation: number
        Offset?: Vector2
      }
    }>
    UIPadding?: {
      PaddingLeft: { Scale: number; Offset: number }
      PaddingRight: { Scale: number; Offset: number }
      PaddingTop: { Scale: number; Offset: number }
      PaddingBottom: { Scale: number; Offset: number }
    }
    UIGradient?: {
      Color: {
        Keypoints: Array<{
          Time: number
          Value: Color3
        }>
      }
      Transparency: {
        Keypoints: Array<{
          Time: number
          Value: number
        }>
      }
      Rotation: number
      Offset?: Vector2
    }
    UIListLayout?: UIListLayout
    UIGridLayout?: UIGridLayout
    CanvasSize?: UDim2
    ScrollBarThickness?: number
    ScrollingDirection?: 'X' | 'Y' | 'XY'
    ElasticBehavior?: 'WhenScrollable' | 'Always' | 'Never'
    ScrollBarImageColor3?: Color3
    ScrollBarImageTransparency?: number
  }
}

export interface AnimationKeyframe {
  id: string
  elementId: string
  time: number
  properties: Record<string, any>
  easing: 'Linear' | 'Quad' | 'Cubic' | 'Quart' | 'Quint' | 'Sine' | 'Expo' | 'Circ' | 'Back' | 'Elastic' | 'Bounce'
  sprSettings?: {
    dampingRatio: number
    undampedFrequency: number
  }
}

export interface FunctionAnimation {
  id: string
  name: string
  keyframes: AnimationKeyframe[]
  duration: number
  sprSettings?: {
    dampingRatio: number
    undampedFrequency: number
  }
}

export interface TimelineTrack {
  elementId: string
  elementName: string
  keyframes: AnimationKeyframe[]
  expanded: boolean
}

export interface Project {
  name: string
  elements: UIElement[]
  animations: AnimationKeyframe[]
  functionAnimations?: FunctionAnimation[]
  duration: number
  canvasWidth: number
  canvasHeight: number
  orientation: 'portrait' | 'landscape'
}

export interface ExportConfig {
  includeComments: boolean
  minify: boolean
  sprSettings: SPRConfig
  targetVersion: 'Luau' | 'Lua5.1'
  animationType?: 'loop' | 'playOnce'
  screenGuiSettings?: {
    name?: string
    ignoreGuiInset?: boolean
    resetOnSpawn?: boolean
    displayOrder?: number
    zIndexBehavior?: 'Sibling' | 'Global'
    autoLocalize?: boolean
    enabled?: boolean
  }
}

export interface SPRConfig {
  dampingRatio: number
  undampedFrequency: number
  speed?: number
}

// Roblox GUI Events by Element Type
export interface RobloxEvent {
  name: string
  displayName: string
  description: string
  supportedElements: RobloxElementType[]
}

export const ROBLOX_EVENTS: RobloxEvent[] = [
  {
    name: 'MouseButton1Click',
    displayName: 'On Click',
    description: 'Fires when the left mouse button is clicked on the element',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'MouseButton1Down',
    displayName: 'On Mouse Down',
    description: 'Fires when the left mouse button is pressed down on the element',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'MouseButton1Up',
    displayName: 'On Mouse Up',
    description: 'Fires when the left mouse button is released over the element',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'MouseEnter',
    displayName: 'On Mouse Enter',
    description: 'Fires when the mouse pointer enters the element bounds',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'MouseLeave',
    displayName: 'On Mouse Leave',
    description: 'Fires when the mouse pointer leaves the element bounds',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'Activated',
    displayName: 'On Activated',
    description: 'Fires when the element is activated (works across all input types)',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'FocusLost',
    displayName: 'On Focus Lost',
    description: 'Fires when the element loses input focus',
    supportedElements: ['TextButton', 'ImageButton', 'TextBox']
  },
  {
    name: 'TouchTap',
    displayName: 'On Touch Tap',
    description: 'Fires when the element is tapped on a touchscreen',
    supportedElements: ['TextButton', 'ImageButton']
  },
  {
    name: 'TouchLongPress',
    displayName: 'On Touch Hold',
    description: 'Fires when the element is held down on a touchscreen',
    supportedElements: ['TextButton', 'ImageButton']
  }
]

// Custom .anim.json format for Zomex•UIX
export interface AnimFile {
  version: string
  name: string
  timestamp: string
  elements: UIElement[]
  animations: AnimationKeyframe[]
  canvasSettings: {
    width: number
    height: number
    orientation: 'portrait' | 'landscape'
  }
}

// .zuix.json format for compatibility
export interface ZuixFile {
  version: string
  name: string
  timestamp: string
  elements: Array<{
    id: string
    type: string
    name: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    parent: string
    properties: {
      backgroundColor: string
      textColor: string
      fontSize: number
      text: string
      cornerRadius: number
      transparency: number
      zIndex: number
      borderColor: string
      borderSizePixel: number
      rotation: number
      visible: boolean
      clipDescendants: boolean
      textStrokeColor: string
      textStrokeTransparency: number
      textScaled: boolean
      textWrapped: boolean
      textXAlignment: string
      textYAlignment: string
      image: string
      imageColor: string
      imageTransparency: number
      scaleType: string
      anchorPoint: { x: number; y: number }
      layoutOrder: number
      sizeConstraint: string
    }
  }>
  canvasResolution: {
    width: number
    height: number
    name: string
    category: string
  }
}

export interface CanvasDevice {
  name: string
  width: number
  height: number
  category: 'mobile' | 'tablet' | 'desktop'
}

export const DEVICE_PRESETS: CanvasDevice[] = [
  { name: 'Mobile Portrait', width: 375, height: 667, category: 'mobile' },
  { name: 'Mobile Landscape', width: 667, height: 375, category: 'mobile' },
  { name: 'Tablet Portrait', width: 768, height: 1024, category: 'tablet' },
  { name: 'Tablet Landscape', width: 1024, height: 768, category: 'tablet' },
  { name: 'Desktop', width: 1920, height: 1080, category: 'desktop' }
]

export interface CanvasViewport {
  zoom: number
  pan: Vector2
  size: { width: number; height: number }
  orientation: 'portrait' | 'landscape'
}