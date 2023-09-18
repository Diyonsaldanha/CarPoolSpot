import React from 'react';
// import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as MdIcons from 'react-icons/md';
import * as IoIcons from 'react-icons/io'; 


export const SidebarData = [
  {
    title: 'Active Trip',
    path: '/active-trip',
    icon: <AiIcons.AiOutlineCar />,
  },
  {
    title: 'Trip History',
    path: '/trip-history',
    icon: <BsIcons.BsCardChecklist />,
  },
  {
    title: 'Drive',
    path: '/drive',
    icon: <AiIcons.AiTwotoneCar />,
  },
  {
    title: 'Ride',
    path: '/ride',
    icon: <MdIcons.MdPeopleOutline />,
  },

  {
    title: 'Pending Requests', 
    path: '/pending-requests', 
    icon: <IoIcons.IoMdTime />, 
  },
  {
    title: 'Check Ride Status', 
    path: '/check-ride-status', 
    icon: <AiIcons.AiOutlineQuestionCircle />, 
  },
];