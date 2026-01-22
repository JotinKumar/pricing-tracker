import * as z from "zod"

export const activitySchema = z.object({
    id: z.number().optional(),
    id1: z
        .string()
        .min(1, "SF Number is required"),
    //.regex(/^\d+$/, "Salesforce ID must be numeric"), // Removed strict numeric check due to SF- prefix
    id2: z.preprocess((val) => val === null ? "" : val, z.string().optional().or(z.literal(''))),
    clientName: z.string().min(1, "Client Name is required"),
    projectName: z.string().min(1, "Project Name is required"),
    verticalId: z.coerce.string().min(1, "Vertical is required"),
    horizontalId: z.preprocess((val) => val === null ? undefined : val, z.coerce.string().optional()),
    annualContractValue: z.coerce.number().min(0, "Value cannot be negative"), // Use coerce for number inputs
    dueDate: z.coerce.date(),

    // Multi-selects (IDs)
    clientLocationIds: z.array(z.number()).default([]),
    deliveryLocationIds: z.array(z.number()).default([]),

    // Dynamic Team Members
    teamMembers: z.array(z.object({
        teamId: z.coerce.number(),
        userId: z.coerce.number()
    })).default([]),

    assignDate: z.preprocess((val) => val === null ? undefined : val, z.coerce.date().optional()),
    statusId: z.preprocess((val) => val === null ? undefined : val, z.coerce.string().optional()),
    categoryId: z.preprocess((val) => val === null ? undefined : val, z.coerce.string().optional()),
    versionId: z.preprocess((val) => val === null ? undefined : val, z.coerce.string().optional()),
    outcomeId: z.preprocess((val) => val === null ? undefined : val, z.coerce.string().optional()),
    newComment: z.preprocess((val) => val === null ? "" : val, z.string().optional()),

    isActive: z.boolean().default(true),
})

export type ActivityFormValues = z.infer<typeof activitySchema>

export const adminUserSchema = z.object({
    id: z.number().optional(),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    name: z.string().optional(),
    firstName: z.string().min(1, "First Name is required").optional(),
    lastName: z.string().optional(),
    initials: z.string().optional(), // Was shortName
    designation: z.string().optional(),
    avatar: z.string().optional(),
    managerId: z.coerce.number().optional(),
    role: z.enum(["USER", "MANAGER", "ADMIN", "READ_ONLY"]),
    teams: z.array(z.number()).default([]),
    isActive: z.boolean().default(true)
})

export type AdminUserFormValues = z.infer<typeof adminUserSchema>

export const adminLookupSchema = z.object({
    id: z.number().optional(),
    display: z.string().optional(),
    isActive: z.boolean().default(true)
    // Dynamic fields will be added or allowed via .passthrough()
}).passthrough()

export type AdminLookupFormValues = z.infer<typeof adminLookupSchema>
