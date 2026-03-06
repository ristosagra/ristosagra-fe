import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../hooks/useAuth";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { ColorVariants } from "../../constant/colors";
import { Input } from "../../components/core/Input";
import { Button } from "../../components/core/Button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ButtonDimensions } from "../../constant/button";

export function CashierLogin() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { mutate: login } = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(
      { username, password },
      {
        onSuccess: ({ success }) => {
          if (success) {
            sessionStorage.setItem("cashier_auth", "true");
            navigate("/cassa/dashboard");
          } else {
            setError("Credenziali errate");
          }
        },
      },
    );
  };

  return (
    <Container>
      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto p-8 flex flex-col gap-4"
      >
        <Label
          label="Login Cassa"
          tag={LabelTags.h2}
          weight={LabelWeight.bold}
          color={ColorVariants.text.grayDark}
          size={LabelDimensions.xlarge}
          noMargin
        />
        <Input
          type={"text"}
          placeholder={"Username"}
          value={username}
          setValue={setUsername}
        />
        <Input
          type={"password"}
          placeholder={"Password"}
          value={password}
          setValue={setPassword}
        />
        {error && (
          <Label
            label={error}
            tag={LabelTags.p}
            color={ColorVariants.text.red}
            weight={LabelWeight.semibold}
            noMargin
          />
        )}
        <Button
          label="Accedi"
          dimension={ButtonDimensions.large}
          bgColor={ColorVariants.bg.grayDark}
          colorLabel={ColorVariants.text.white}
          onClick={() => {}}
          fullWidth
        />
      </form>
    </Container>
  );
}
