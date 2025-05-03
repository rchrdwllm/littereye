import { Link, useLocation, Outlet } from "react-router-dom";
import {
  ArrowUpTrayIcon,
  CameraIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  {
    name: "Upload",
    href: "/upload",
    icon: ArrowUpTrayIcon,
  },
  {
    name: "Webcam",
    href: "/webcam",
    icon: CameraIcon,
  },
  {
    name: "Detections",
    href: "/detections",
    icon: EyeIcon,
  },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div
      className={`flex min-h-screen bg-gray-50 font-geist flex-col-reverse sm:flex-row`}
    >
      <aside className="sticky bottom-0 bg-white flex flex-col justify-between p-4 sm:py-8 w-full border-t sm:w-64 sm:border-t-0 sm:border-r">
        <div className="flex flex-col gap-4">
          <div className="hidden sm:flex items-center justify-center gap-2 font-bold text-xl">
            <span className="inline-block">
              <EyeIcon className="h-7 w-7 text-primary" />
            </span>
            LitterEye
          </div>
          <nav>
            <ul className="space-y-1 grid grid-cols-3 gap-4 sm:gap-0 px-4 sm:px-0 items-stretch sm:grid-cols-1 sm:items-start">
              {navItems.map((item) => {
                const active = location.pathname === item.href;

                return (
                  <li
                    className={`sm:w-full flex justify-center items-center sm:block px-4 py-2 transition-colors rounded-lg ${active ? "bg-blue-100 text-primary" : "text-gray-700 bg-white hover:bg-gray-100"}`}
                    key={item.href}
                  >
                    <Link
                      className="flex flex-col gap-1 sm:flex-row w-full justify-center items-center sm:justify-start sm:gap-3 text-base font-medium"
                      to={item.href}
                    >
                      <item.icon className="size-4" />
                      <span className="text-xs text-center sm:text-left sm:text-base">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="text-center text-xs text-gray-400 mt-2">
          © 2025 LitterEye
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-10">
        <Outlet />
      </main>
    </div>
  );
}
