# Pricing Tracker

A comprehensive Next.js application for managing and tracking pricing activities, deals, and team collaboration. Built with modern web technologies and featuring role-based access control, dynamic team management, and file storage capabilities.

## 🚀 Features

### Core Functionality
- **Activity Management**: Create, edit, and track pricing activities with detailed information
- **Dynamic Team Assignment**: Assign team members from different teams to activities
- **File Management**: Upload and manage attachments with notes for each Salesforce ID
- **Advanced Filtering**: Filter activities by status, category, version, team members, and more
- **Search & Pagination**: Efficient search across activities with paginated results
- **Role-Based Access Control**: Admin, Manager, User, and Read-Only roles with appropriate permissions
- **Default Assignments**: Auto-assign users to activities based on vertical, horizontal, or location

### User Interface
- **Responsive Design**: Mobile-friendly layout with dark/light theme support
- **Enhanced Navigation**: Glassmorphic navbar with micro-interactions and adaptive animations
- **Activity Table**: Sortable, filterable table with inline status updates
- **Admin Panel**: Manage users, teams, and lookup tables (statuses, categories, etc.)
- **Interactive Forms**: Rich form components with validation using React Hook Form and Zod
- **Real-time Updates**: Optimistic updates and toast notifications

### Data Management
- **Comprehensive Lookups**: Verticals, Horizontals, Locations, Statuses, Categories, Versions, Outcomes
- **Team Management**: Organize users into teams with hierarchical structure
- **User Hierarchies**: Manager-subordinate relationships
- **Activity Tracking**: Track creation dates, due dates, assignment dates, and updates
- **Comments System**: Add comments to activities for collaboration

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI (shadcn/ui components)
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode

### Backend
- **Database**: SQLite with Prisma ORM
- **Authentication**: Session-based authentication
- **File Storage**: Local file system storage
- **API**: Next.js Server Actions

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prisma**: Database schema and migrations
- **tsx**: TypeScript execution for scripts

## 📋 Prerequisites

- Node.js 18+ or Bun
- npm/pnpm/yarn/bun package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jotinkumar/pricing-tracker.git
cd pricing-tracker
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET=
```

Set `SESSION_SECRET` to a unique, private random value before starting the app. It signs session cookies, is required for login, and must stay in your local `.env` file.

### 4. Database Setup

Initialize the database and seed it with sample data:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login

The seed script creates sample users. You can log in with any seeded user email (check the console output after seeding).

## 📁 Project Structure

```
pricing-tracker/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main dashboard pages
│   ├── login/             # Authentication pages
│   └── api/               # API routes
├── components/            # React components
│   ├── activity-form/     # Activity creation/editing
│   ├── admin-panel/       # Admin management UI
│   ├── dashboard/         # Dashboard components
│   └── ui/                # Reusable UI components (shadcn/ui)
├── lib/                   # Utilities and helpers
│   ├── actions/           # Server actions
│   ├── constants.ts       # Application constants
│   ├── db.ts              # Prisma client
│   └── utils.ts           # Utility functions
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── storage/               # File storage directory
└── public/                # Static assets
```

## 🗄️ Database Schema

### Main Models

- **User**: Users with roles, team assignments, and hierarchies
- **Team**: Teams for organizing users
- **PricingActivity**: Main activity/deal tracking
- **ActivityTeamMember**: Many-to-many relationship for activity team members
- **Comment**: Comments on activities
- **Attachment**: File attachments linked to Salesforce IDs

### Lookup Tables

- **Vertical**: Industry verticals
- **Horizontal**: Horizontal business areas
- **Location**: Countries/locations for client and delivery
- **Status**: Activity statuses
- **Category**: Activity categories
- **Version**: Pricing versions
- **Outcome**: Deal outcomes
- **DocumentType**: Document types

### Configuration

- **SystemSetting**: System-wide settings
- **DefaultAssignment**: Auto-assignment rules
- **FieldConfig**: Dynamic field configurations

## 🔑 User Roles

- **ADMIN**: Full access to all features including admin panel
- **MANAGER**: Can manage activities and view reports
- **USER**: Can create and edit their own activities
- **READ_ONLY**: View-only access to assigned activities

## 🎨 Features in Detail

### Activity Management
- Create multi-step activities with client info, team members, and financials
- Assign team members from different functional teams
- Track status, category, version, and outcomes
- Set due dates and monitor progress

### Admin Panel
- Manage users (create, edit, deactivate)
- Manage teams and team assignments
- Configure lookup tables (statuses, categories, verticals, etc.)
- Set default user assignments for auto-assignment

### File Storage
- Upload files linked to Salesforce IDs
- Add notes to attachments
- Download files
- Shared across all activities with the same Salesforce ID

### Filtering & Search
- Filter by status, category, version, team members
- Search across client names, project names, and IDs
- View modes: Pipeline, Closed, Inactive
- Custom column visibility

## 🧪 Database Management

### View Database in Prisma Studio

```bash
npx prisma studio
```

### Reset Database

```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Create Migration (for production)

```bash
npx prisma migrate dev --name migration_name
```

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db seed` - Seed database (runs `prisma/seed.ts`)

## 🎨 Customization

### Themes
The application supports light and dark themes. Theme preference is persisted using `next-themes`.

### Styling
- Tailwind CSS for utility-first styling
- CSS variables for theme colors (defined in `app/globals.css`)
- shadcn/ui components for consistent UI

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📏 Development Standards

To maintain code quality and consistency, all contributors must strictly follow our internal guides:

- **[Refactoring Guide](docs/REFACTOR_GUIDE.md)**: Standards for component structure, hooks, and performance.
- **[Style Guide](docs/STYLE_GUIDE.md)**: Naming conventions for files, folders, and components.

Please read these documents **before** making any changes.


## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE.txt) file for details.

## 👤 Author

**Jotin Kumar**
- GitHub: [@jotinkumar](https://github.com/jotinkumar)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Database ORM: [Prisma](https://www.prisma.io)

---

For questions or support, please open an issue on the [GitHub repository](https://github.com/jotinkumar/pricing-tracker).
