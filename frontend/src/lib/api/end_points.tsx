export const API: Record<string, string> = {
  // ADMIN END-POINT
  ADMIN_LOGIN: "admin/login",
  // MERCHANT END-POINTS
  LOGIN: "login",
  REGISTER: "register",
  REFRESH_TOKEN: "refresh-token",
};

export const getRoute = (val: string): string => {
  const uri: string | undefined | null = API[val];
  if (uri === null || uri === undefined) {
    throw new Error("key doesn't exist");
  }
  return uri;
};

export const pipe = (pattern: string, map: Record<string, string | number>) => {
  return pattern.replace(/:([^/]+)/g, (_, key: string): string => {
    if (key in map) {
      return String(map[key]);
    }
    throw new Error(`Key "${key}" not found in the map`);
  });
};
