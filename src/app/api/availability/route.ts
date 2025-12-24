import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    // Check if Supabase is configured
    if (!supabase) {
      return Response.json(
        {
          message: "Supabase not configured. Using fallback availability.",
          blockedDates: [],
          success: false,
        },
        { status: 200 }
      );
    }

    // Fetch all blocked dates from Supabase
    const { data, error } = await supabase
      .from("availability_blocks")
      .select("date");

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        {
          message: "Supabase connection error. Using fallback availability.",
          blockedDates: [],
          success: false,
        },
        { status: 200 }
      );
    }

    // Extract dates and convert to number format (for Calendar component)
    const blockedDates = (data as { date: string }[])?.map((row) => {
      const date = new Date(row.date);
      return date.getDate();
    }) || [];

    return Response.json({
      blockedDates: blockedDates,
      success: true,
      message: `Fetched ${blockedDates.length} blocked dates from Supabase`,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return Response.json(
      {
        message: "Error fetching availability. Using fallback.",
        blockedDates: [],
        success: false,
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();

    // Check if Supabase is configured
    if (!supabase) {
      return Response.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { date, reason } = body;

    if (!date) {
      return Response.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Add blocked date to Supabase
    const { data, error } = await (supabase.from("availability_blocks") as any).insert({
      date: date,
      reason: reason || "blocked",
    }).select();

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        {
          error: "Failed to add blocked date",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: data,
      message: "Blocked date added successfully",
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
