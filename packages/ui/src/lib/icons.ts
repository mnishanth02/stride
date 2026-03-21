import { ArrowLeft } from "@phosphor-icons/react/dist/icons/ArrowLeft"
import { CalendarBlank } from "@phosphor-icons/react/dist/icons/CalendarBlank"
import { CaretDown } from "@phosphor-icons/react/dist/icons/CaretDown"
import { CaretUpDown } from "@phosphor-icons/react/dist/icons/CaretUpDown"
import { Check } from "@phosphor-icons/react/dist/icons/Check"
import { Clock } from "@phosphor-icons/react/dist/icons/Clock"
import { CloudArrowUp } from "@phosphor-icons/react/dist/icons/CloudArrowUp"
import { Fire } from "@phosphor-icons/react/dist/icons/Fire"
import { GlobeSimple } from "@phosphor-icons/react/dist/icons/GlobeSimple"
import { House } from "@phosphor-icons/react/dist/icons/House"
import { Image } from "@phosphor-icons/react/dist/icons/Image"
import { List } from "@phosphor-icons/react/dist/icons/List"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/icons/MagnifyingGlass"
import { Medal } from "@phosphor-icons/react/dist/icons/Medal"
import { Moon } from "@phosphor-icons/react/dist/icons/Moon"
import { Mountains } from "@phosphor-icons/react/dist/icons/Mountains"
import { Pencil } from "@phosphor-icons/react/dist/icons/Pencil"
import { PersonSimpleRun } from "@phosphor-icons/react/dist/icons/PersonSimpleRun"
import { Plus } from "@phosphor-icons/react/dist/icons/Plus"
import { ShareNetwork } from "@phosphor-icons/react/dist/icons/ShareNetwork"
import { SignIn } from "@phosphor-icons/react/dist/icons/SignIn"
import { SignOut } from "@phosphor-icons/react/dist/icons/SignOut"
import { Star } from "@phosphor-icons/react/dist/icons/Star"
import { Sun } from "@phosphor-icons/react/dist/icons/Sun"
import { Timer } from "@phosphor-icons/react/dist/icons/Timer"
import { Trash } from "@phosphor-icons/react/dist/icons/Trash"
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
  chevronUpDown: CaretUpDown,

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
  edit: Pencil,
  delete: Trash,
  upload: UploadSimple,
  cloudUpload: CloudArrowUp,
  share: ShareNetwork,
  check: Check,

  // Content
  image: Image,
  calendar: CalendarBlank,
  clock: Clock,
  timer: Timer,
  globe: GlobeSimple,

  // Athlete-specific
  run: PersonSimpleRun,
  trophy: Trophy,
  medal: Medal,
  fire: Fire,
  star: Star,
  mountains: Mountains,

  // Feedback
  warning: Warning,
} as const

export type IconName = keyof typeof Icons
