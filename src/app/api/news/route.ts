import { NextRequest, NextResponse } from "next/server";
import { getGamingNews } from "@/lib/news";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "15");

    try {
        const data = await getGamingNews(page, pageSize);
        return NextResponse.json(data);
    } catch (error) {
        console.error("News API Error:", error);
        return NextResponse.json(
            { status: "error", totalResults: 0, articles: [] },
            { status: 500 }
        );
    }
}
