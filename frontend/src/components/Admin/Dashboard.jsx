import { useState, useContext } from "react";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Typography,
  Button,
} from "@material-tailwind/react";
import { AuthContext } from "../../context/AuthContext.jsx";
import ManageUsers from "./ManageUsers.jsx";
import ManageMenu from "./ManageMenu.jsx";
import ManageReservations from "./ManageReservations.jsx";
import ManageOrders from "./ManageOrders.jsx";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const { logout } = useContext(AuthContext);

  const tabs = [
    { label: "Users", value: "users", component: <ManageUsers /> },
    { label: "Menu", value: "menu", component: <ManageMenu /> },
    {
      label: "Reservations",
      value: "reservations",
      component: <ManageReservations />,
    },
    { label: "Orders", value: "orders", component: <ManageOrders /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-[#FDCB58] p-4 flex justify-between items-center mb-8">
        <Typography variant="h4" className="text-[#5A3E36]">
          Admin Dashboard
        </Typography>
        <Button
          onClick={logout}
          className="bg-[#FF9130] text-white hover:bg-[#E07B00]"
        >
          Logout
        </Button>
      </div>
      <Tabs value={activeTab} className="mt-6">
        <TabsHeader
          className="bg-[#FFF2CC]"
          indicatorProps={{ className: "bg-[#FF9130] shadow-none" }}
        >
          {tabs.map(({ label, value }) => (
            <Tab
              key={value}
              value={value}
              onClick={() => setActiveTab(value)}
              className="text-[#5A3E36]"
            >
              {label}
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody>
          {tabs.map(({ value, component }) => (
            <TabPanel key={value} value={value}>
              {component}
            </TabPanel>
          ))}
        </TabsBody>
      </Tabs>
    </div>
  );
};

export default Dashboard;
