const CREDENTIALS = { username: "admin", password: "admin" };

export const fakeLogin = async (
  username: string,
  password: string,
): Promise<{ success: boolean }> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    success:
      username === CREDENTIALS.username && password === CREDENTIALS.password,
  };
};
