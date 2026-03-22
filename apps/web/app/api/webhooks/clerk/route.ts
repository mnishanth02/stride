import { verifyWebhook, type WebhookEvent } from "@clerk/nextjs/webhooks"
import { db } from "@workspace/database/client"
import { users } from "@workspace/database/schema"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

interface EmailAddress {
  id: string
  email_address: string
  verification: { status: string } | null
}

function findPrimaryEmail(
  emailAddresses: EmailAddress[],
  primaryEmailAddressId: string | null
) {
  if (primaryEmailAddressId) {
    const primary = emailAddresses.find((e) => e.id === primaryEmailAddressId)
    if (primary) return primary
  }
  return emailAddresses[0]
}

export async function POST(req: NextRequest) {
  let evt: WebhookEvent

  try {
    evt = await verifyWebhook(req)
  } catch {
    return new Response("Error", { status: 400 })
  }

  try {
    switch (evt.type) {
      case "user.created": {
        const {
          id,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
          image_url,
        } = evt.data
        const primaryEmail = findPrimaryEmail(
          email_addresses,
          primary_email_address_id
        )

        await db
          .insert(users)
          .values({
            clerkId: id,
            email: primaryEmail?.email_address ?? "",
            emailVerified: primaryEmail?.verification?.status === "verified",
            fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
            avatarUrl: image_url ?? null,
          })
          .onConflictDoNothing({ target: users.clerkId })

        break
      }

      case "user.updated": {
        const {
          id,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
          image_url,
        } = evt.data
        const primaryEmail = findPrimaryEmail(
          email_addresses,
          primary_email_address_id
        )

        const updateData = {
          email: primaryEmail?.email_address ?? "",
          emailVerified: primaryEmail?.verification?.status === "verified",
          fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url ?? null,
          updatedAt: new Date(),
        }

        // Self-healing upsert: if user.created was missed, create the row
        await db
          .insert(users)
          .values({ clerkId: id, ...updateData })
          .onConflictDoUpdate({ target: users.clerkId, set: updateData })

        break
      }

      case "user.deleted": {
        if (evt.data.id) {
          // TODO: When building query layer for highlights/personal_records/achievements,
          // ensure all queries join on users.isDeleted = false, or propagate isDeleted to child tables.
          // Currently only the user row is soft-deleted — child data remains queryable.
          await db
            .update(users)
            .set({
              isDeleted: true,
              deletedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.clerkId, evt.data.id))
        }

        break
      }
    }

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return new Response("Error", { status: 500 })
  }
}
