using System.Globalization;

namespace JobForStudents.Helpers;

public static class VietnamTime
{
    private static readonly TimeZoneInfo TimeZone = CreateVietnamTimeZone();

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZone);

    public static DateTime FromUtc(DateTime value)
    {
        var utc = value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);

        return TimeZoneInfo.ConvertTimeFromUtc(utc, TimeZone);
    }

    public static string Format(DateTime value, string format)
    {
        return FromUtc(value).ToString(format, CultureInfo.GetCultureInfo("vi-VN"));
    }

    public static string Format(DateTime? value, string format)
    {
        return value.HasValue ? Format(value.Value, format) : string.Empty;
    }

    private static TimeZoneInfo CreateVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
    }
}
