using JobForStudents.Models;
using JobForStudents.Services;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace JobForStudents.Controllers;

public class HomeController(MockJobService jobService) : Controller
{
    // GET: / — Main Dashboard
    public IActionResult Index()
    {
        var model = jobService.GetDashboard();
        return View("Dashboard", model);
    }

    // GET: /Home/FilterByCategory?category=Design
    [HttpGet]
    public IActionResult FilterByCategory(string category)
    {
        var jobs = jobService.FilterByCategory(category);
        return Json(jobs);
    }

    // GET: /Home/SearchJobs?searchTerm=poster
    [HttpGet]
    public IActionResult SearchJobs(string searchTerm)
    {
        var jobs = jobService.SearchJobs(searchTerm);
        return Json(jobs);
    }

    // POST: /Home/ToggleSaveJob
    [HttpPost]
    public IActionResult ToggleSaveJob([FromBody] JobActionRequest request)
    {
        var job = jobService.ToggleSave(request.JobId);
        if (job is null)
            return NotFound(new { success = false, message = "Không tìm thấy việc làm." });

        return Json(new { success = true, isSaved = job.IsSaved, jobId = job.Id });
    }

    // POST: /Home/ApplyJob
    [HttpPost]
    public IActionResult ApplyJob([FromBody] JobActionRequest request)
    {
        var job = jobService.ApplyJob(request.JobId);
        if (job is null)
            return NotFound(new { success = false, message = "Không tìm thấy việc làm." });

        return Json(new
        {
            success = true,
            isApplied = job.IsApplied,
            applicantsCount = job.ApplicantsCount,
            jobId = job.Id
        });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}

// Simple request model for POST actions
public class JobActionRequest
{
    public string JobId { get; set; } = string.Empty;
}
