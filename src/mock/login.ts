const CREDENTIALS = { username: "admin", password: "admin" };

export const fakeLogin = async (
  username: string,
  password: string,
): Promise<{ success: boolean; token: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    success:
      username === CREDENTIALS.username && password === CREDENTIALS.password,
    token: "fake-jwt-token-12345",
  };
};
