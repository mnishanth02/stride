import { ArrowLeft } from "@phosphor-icons/react/dist/icons/ArrowLeft"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/icons/ArrowSquareOut"
import { CalendarBlank } from "@phosphor-icons/react/dist/icons/CalendarBlank"
import { CaretDown } from "@phosphor-icons/react/dist/icons/CaretDown"
import { CaretLeft } from "@phosphor-icons/react/dist/icons/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/icons/CaretRight"
import { CaretUp } from "@phosphor-icons/react/dist/icons/CaretUp"
import { CaretUpDown } from "@phosphor-icons/react/dist/icons/CaretUpDown"
import { Check } from "@phosphor-icons/react/dist/icons/Check"
import { CheckCircle } from "@phosphor-icons/react/dist/icons/CheckCircle"
import { CircleNotch } from "@phosphor-icons/react/dist/icons/CircleNotch"
import { Clock } from "@phosphor-icons/react/dist/icons/Clock"
import { CloudArrowUp } from "@phosphor-icons/react/dist/icons/CloudArrowUp"
import { Copy } from "@phosphor-icons/react/dist/icons/Copy"
import { DownloadSimple } from "@phosphor-icons/react/dist/icons/DownloadSimple"
import { Eye } from "@phosphor-icons/react/dist/icons/Eye"
import { EyeSlash } from "@phosphor-icons/react/dist/icons/EyeSlash"
import { Fire } from "@phosphor-icons/react/dist/icons/Fire"
import { Gauge } from "@phosphor-icons/react/dist/icons/Gauge"
import { GearSix } from "@phosphor-icons/react/dist/icons/GearSix"
import { GlobeSimple } from "@phosphor-icons/react/dist/icons/GlobeSimple"
import { Heart } from "@phosphor-icons/react/dist/icons/Heart"
import { House } from "@phosphor-icons/react/dist/icons/House"
import { Image } from "@phosphor-icons/react/dist/icons/Image"
import { Info } from "@phosphor-icons/react/dist/icons/Info"
import { Link } from "@phosphor-icons/react/dist/icons/Link"
import { List } from "@phosphor-icons/react/dist/icons/List"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/icons/MagnifyingGlass"
import { MapPin } from "@phosphor-icons/react/dist/icons/MapPin"
import { Medal } from "@phosphor-icons/react/dist/icons/Medal"
import { Moon } from "@phosphor-icons/react/dist/icons/Moon"
import { Mountains } from "@phosphor-icons/react/dist/icons/Mountains"
import { Pencil } from "@phosphor-icons/react/dist/icons/Pencil"
import { PencilSimple } from "@phosphor-icons/react/dist/icons/PencilSimple"
import { PersonSimpleRun } from "@phosphor-icons/react/dist/icons/PersonSimpleRun"
import { Plus } from "@phosphor-icons/react/dist/icons/Plus"
import { PlusCircle } from "@phosphor-icons/react/dist/icons/PlusCircle"
import { ShareNetwork } from "@phosphor-icons/react/dist/icons/ShareNetwork"
import { SignIn } from "@phosphor-icons/react/dist/icons/SignIn"
import { SignOut } from "@phosphor-icons/react/dist/icons/SignOut"
import { Sneaker } from "@phosphor-icons/react/dist/icons/Sneaker"
import { Star } from "@phosphor-icons/react/dist/icons/Star"
import { Sun } from "@phosphor-icons/react/dist/icons/Sun"
import { Target } from "@phosphor-icons/react/dist/icons/Target"
import { Timer } from "@phosphor-icons/react/dist/icons/Timer"
import { Trash } from "@phosphor-icons/react/dist/icons/Trash"
import { TrendUp } from "@phosphor-icons/react/dist/icons/TrendUp"
import { Trophy } from "@phosphor-icons/react/dist/icons/Trophy"
import { UploadSimple } from "@phosphor-icons/react/dist/icons/UploadSimple"
import { User } from "@phosphor-icons/react/dist/icons/User"
import { UserCircle } from "@phosphor-icons/react/dist/icons/UserCircle"
import { Warning } from "@phosphor-icons/react/dist/icons/Warning"
import { X } from "@phosphor-icons/react/dist/icons/X"

export const Icons = {
  // Navigation
  home: House,
  back: ArrowLeft,
  menu: List,
  close: X,
  search: MagnifyingGlass,
  chevronDown: CaretDown,
  chevronUp: CaretUp,
  chevronLeft: CaretLeft,
  chevronRight: CaretRight,
  chevronUpDown: CaretUpDown,
  externalLink: ArrowSquareOut,

  // Auth
  signIn: SignIn,
  signOut: SignOut,
  user: User,
  userCircle: UserCircle,

  // Theme
  sun: Sun,
  moon: Moon,

  // Actions
  add: Plus,
  addCircle: PlusCircle,
  edit: Pencil,
  editSimple: PencilSimple,
  delete: Trash,
  upload: UploadSimple,
  download: DownloadSimple,
  cloudUpload: CloudArrowUp,
  share: ShareNetwork,
  copyLink: Link,
  check: Check,
  checkCircle: CheckCircle,
  settings: GearSix,

  // Content
  image: Image,
  calendar: CalendarBlank,
  clock: Clock,
  timer: Timer,
  globe: GlobeSimple,
  location: MapPin,

  // Athlete-specific
  run: PersonSimpleRun,
  sneaker: Sneaker,
  trophy: Trophy,
  medal: Medal,
  fire: Fire,
  flame: Fire,
  star: Star,
  mountains: Mountains,
  target: Target,
  pace: Gauge,
  heart: Heart,
  trendUp: TrendUp,

  // Feedback
  info: Info,
  warning: Warning,
  loading: CircleNotch,
  eye: Eye,
  eyeSlash: EyeSlash,
  copy: Copy,
} as const

export type IconName = keyof typeof Icons
