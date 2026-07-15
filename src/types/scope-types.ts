export type ManagementScope =
  | {
      level: "global";
      centerId?: string;
    }
  | {
      level: "center";
      centerId: string;
    }
  | {
      level: "class";
      centerId: string;
      classId: string;
    };

export type ContentScope =
  | {
      type: "global";
    }
  | {
      type: "center";
      centerId: string;
      centerName: string;
    };

export type DashboardUserPermissions = {
  canAccessGlobalErg: boolean;
  assignedCenterIds: string[];
  roles: string[];
  grantedPermissions: string[];
  deniedPermissions: string[];
};
