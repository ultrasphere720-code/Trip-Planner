import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    await prisma.trip.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Trip deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete trip:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete trip" },
      { status: 500 }
    );
  }
}
