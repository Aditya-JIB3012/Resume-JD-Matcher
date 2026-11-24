import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const resumePath = path.join(process.cwd(), "sample_data", "sample_resume.txt");
    const jdPath = path.join(process.cwd(), "sample_data", "sample_jd.txt");

    let sampleResume = "";
    let sampleJd = "";

    if (fs.existsSync(resumePath)) {
      sampleResume = fs.readFileSync(resumePath, "utf-8");
    }
    if (fs.existsSync(jdPath)) {
      sampleJd = fs.readFileSync(jdPath, "utf-8");
    }

    return NextResponse.json({
      sampleResume,
      sampleJd,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load sample data", details: String(error) },
      { status: 500 }
    );
  }
}
