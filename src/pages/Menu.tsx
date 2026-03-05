import { Card } from "../components/Card/Card";
import { Container } from "../components/core/Container";
import { Label } from "../components/core/Label";
import { Loader } from "../components/core/Loader";
import { useMenu } from "../hooks/useMenu";
import { LabelTags, TextDimensions, TextWeight } from "../types/costant";
import type { Dish, MenuProps } from "../types/types";
import { ColorVariants } from "../utils/colors";

export default function Menu({ cartItems, setCartItems }: MenuProps) {
  const { data: dishes, isLoading, isError } = useMenu();

  if (isLoading) {
    return <Loader />;
  }
  if (isError) {
    return (
      <div className="flex justify-center items-center h-64 text-red-400">
        Errore nel caricamento del menù
      </div>
    );
  }

  const grouped = dishes!.reduce(
    (acc, dish) => {
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    },
    {} as Record<string, Dish[]>,
  );

  return (
    <Container>
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="px-5 my-5">
          <Label
            label={category}
            color={ColorVariants.text.orange}
            colorBorderBottom={ColorVariants.border.grayLight}
            tag={LabelTags.h2}
            weight={TextWeight.bold}
            size={TextDimensions.xlarge}
          />
          <div className="space-y-3">
            {items.map((dish) => (
              <Card
                key={dish.id}
                dish={dish}
                cartItems={cartItems}
                setCartItems={setCartItems}
              />
            ))}
          </div>
        </section>
      ))}
    </Container>
  );
}
