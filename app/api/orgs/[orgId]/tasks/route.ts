import { NextResponse } from "next/server";
import { createTaskSchema } from "@/lib/validators/task";
import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  let task;
  try {
    task = await prisma.task.create({
      data: {
        orgId,
        title: data.title,
        description: data.description ?? null,
        durationMin: data.durationMin,
        preferredStartTimeMin: data.preferredStartTimeMin ?? null,
        peopleRequired: data.peopleRequired ?? 1,
        minWaitDays: data.minWaitDays ?? null,
        maxWaitDays: data.maxWaitDays ?? null,
      },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        // Foreign key constraint: orgId does not exist
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 },
        );
      }
      if (e.code === "P2002") {
        // Unique constraint: @@unique([orgId, title])
        return NextResponse.json(
          { error: "A task with this title already exists in the organization" },
          { status: 409 },
        );
      }
    }
    throw e;
  }

  return NextResponse.json(task, { status: 201 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const tasks = await prisma.task.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}
