import { ToggleGroup } from "../ui/toggle-group"
import ConfirmationItemsRow from "@/components/Order/ConfirmationItemsRow"

export default function PaymentMethod() {
    return(
        <section className="flex flex-col gap-4  rounded-md">
            <h2 className="text-xl md:text-2xl font-bold">Payment Method</h2>
            <p className="text-md md:text-lg text-muted-foreground">
              Select your payment option.
            </p>
            <div className="flex flex-col gap-4">
              <ToggleGroup
                type="single"
                className="w-full gap-4 md:px-0 px-2 flex flex-wrap"
                defaultValue="online"
                variant="order"
                size="xl"
              >
                <ConfirmationItemsRow item={{ name: "Online Payment", image: "/src/assets/stripe.png", value: "online" , description: "Pay securely using stripe" }} />
                <ConfirmationItemsRow item={{ name: "Cash on Delivery", image: "/src/assets/cod.png", value: "cod", description: "Pay with cash upon delivery" }} />
              </ToggleGroup>
            </div>
        </section>
    )
}