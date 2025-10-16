
import { ToggleGroup } from "../ui/toggle-group"
import ConfirmationItemsRow  from "@/components/Order/ConfirmationItemsRow";

export default function ShippingMethod() {
    return(
        <section className="flex flex-col gap-4  rounded-md">
            <h2 className="text-xl md:text-2xl font-bold">Shipping Method</h2>
            <div className="flex flex-col gap-4">
              <ToggleGroup
                type="single"
                className="w-full gap-4 md:px-0 px-2 flex flex-wrap"
                defaultValue="standard"
                variant="order"
                size="xl"
              >
                <ConfirmationItemsRow item={{ name: "Standard Shipping", image: "/src/assets/standard-delivery.png", value: "standard", description: "Delivers in 5-7 business days" }} />
                <ConfirmationItemsRow item={{ name: "Store Pickup", image: "/src/assets/store-pickup.png", value: "pickup", description: "Pick up at your nearest store" }} />
              </ToggleGroup>
            </div>
          </section>
    )
}