const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "DigiMark backend is live" });
});

module.exports = router;

model Contact {
  id             String   @id @default(uuid())
  firstName      String
  lastName       String?
  email          String?
  phone          String?
  company        String?
  status         String   // lead, customer, churned, etc.
  source         String?  // ad, referral, organic, etc.
  tags           String[] // simple tag list
  ownerId        String
  organization   Organization? @relation(fields: [organizationId], references: [id])
  organizationId String?
  deals          Deal[]
  activities     Activity[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Organization {
  id          String   @id @default(uuid())
  name        String
  domain      String?
  industry    String?
  size        String?
  ownerId     String
  contacts    Contact[]
  deals       Deal[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Deal {
  id             String   @id @default(uuid())
  title          String
  value          Int
  stage          Stage    @relation(fields: [stageId], references: [id])
  stageId        String
  pipeline       Pipeline @relation(fields: [pipelineId], references: [id])
  pipelineId     String
  contact        Contact? @relation(fields: [contactId], references: [id])
  contactId      String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  organizationId String?
  ownerId        String
  closeDate      DateTime?
  probability    Int?
  activities     Activity[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Pipeline {
  id        String  @id @default(uuid())
  name      String
  type      String  // sales, onboarding, etc.
  stages    Stage[]
  deals     Deal[]
  createdAt DateTime @default(now())
}

model Stage {
  id         String  @id @default(uuid())
  name       String
  order      Int
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id])
  pipelineId String
  isWon      Boolean @default(false)
  isLost     Boolean @default(false)
  deals      Deal[]
}

model Activity {
  id           String   @id @default(uuid())
  type         String   // call, email, note, task
  content      String
  dueAt        DateTime?
  completedAt  DateTime?
  contact      Contact? @relation(fields: [contactId], references: [id])
  contactId    String?
  deal         Deal?    @relation(fields: [dealId], references: [id])
  dealId       String?
  createdBy    String
  createdAt    DateTime @default(now())
}
/src
  /routes
    /crm
      contacts.ts
      deals.ts
      pipelines.ts
      activities.ts
import { Router } from "express";
import prisma from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// Get all contacts
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const contacts = await prisma.contact.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" }
  });
  res.json(contacts);
});

// Create a contact
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const data = req.body;

  const contact = await prisma.contact.create({
    data: {
      ...data,
      ownerId: userId
    }
  });

  res.json(contact);
});

// Update a contact
router.patch("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const contact = await prisma.contact.update({
    where: { id },
    data
  });

  res.json(contact);
});

// Delete a contact
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  await prisma.contact.delete({
    where: { id }
  });

  res.json({ success: true });
});

export default router;
import contacts from "./routes/crm/contacts";

app.use("/api/contacts", contacts);
model Pipeline {
  id        String   @id @default(uuid())
  name      String
  type      String   // sales, onboarding, fulfillment, renewals
  stages    Stage[]
  deals     Deal[]
  ownerId   String   // who created it
  createdAt DateTime @default(now())
}

model Stage {
  id         String   @id @default(uuid())
  name       String
  order      Int
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id])
  pipelineId String
  isWon      Boolean  @default(false)
  isLost     Boolean  @default(false)
  deals      Deal[]
}

model Deal {
  id             String   @id @default(uuid())
  title          String
  value          Int
  pipeline       Pipeline @relation(fields: [pipelineId], references: [id])
  pipelineId     String
  stage          Stage    @relation(fields: [stageId], references: [id])
  stageId        String
  contactId      String?
  organizationId String?
  ownerId        String
  closeDate      DateTime?
  probability    Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
import { Router } from "express";
import prisma from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// Get all pipelines
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const pipelines = await prisma.pipeline.findMany({
    where: { ownerId: userId },
    include: { stages: { orderBy: { order: "asc" } } }
  });

  res.json(pipelines);
});

// Create a pipeline
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { name, type, stages } = req.body;

  const pipeline = await prisma.pipeline.create({
    data: {
      name,
      type,
      ownerId: userId,
      stages: {
        create: stages.map((s: any, i: number) => ({
          name: s,
          order: i
        }))
      }
    },
    include: { stages: true }
  });

  res.json(pipeline);
});

// Add a stage to an existing pipeline
router.post("/:id/stages", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const count = await prisma.stage.count({
    where: { pipelineId: id }
  });

  const stage = await prisma.stage.create({
    data: {
      name,
      order: count,
      pipelineId: id
    }
  });

  res.json(stage);
});

export default router;
import { Router } from "express";
import prisma from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// Get all deals
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const deals = await prisma.deal.findMany({
    where: { ownerId: userId },
    include: {
      stage: true,
      pipeline: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(deals);
});

// Create a deal
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { title, value, pipelineId, stageId, contactId, organizationId } = req.body;

  const deal = await prisma.deal.create({
    data: {
      title,
      value,
      pipelineId,
      stageId,
      contactId,
      organizationId,
      ownerId: userId
    }
  });

  res.json(deal);
});

// Move deal to another stage
router.patch("/:id/move", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { stageId } = req.body;

  const deal = await prisma.deal.update({
    where: { id },
    data: { stageId }
  });

  res.json(deal);
});

export default router;
import pipelines from "./routes/crm/pipelines";
import deals from "./routes/crm/deals";

app.use("/api/pipelines", pipelines);
app.use("/api/deals", deals);
