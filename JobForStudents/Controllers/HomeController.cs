using JobForStudents.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace JobForStudents.Controllers
{
    public class HomeController : Controller
    {
        // Trang chủ = Dashboard
        public IActionResult Index()
        {
            return View("Dashboard");
        }

        public IActionResult Dashboard()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
