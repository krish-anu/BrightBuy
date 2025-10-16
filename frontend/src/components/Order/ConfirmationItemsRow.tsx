import {ToggleGroupItem } from "../ui/toggle-group";



export default function ConfirmationItemsRow({item}: {item: any}) {
    return(
        <ToggleGroupItem value={item.value} className="justify-between">
            <div className=" flex flex-col justify-between text-left">
                    <span className="md:text-xl text-lg px-4">{item.name}</span>
                    <span className="md:text-md text-sm px-4 text-muted-foreground">{item.description}</span>
            </div>
            <img src={item.image} className="md:h-16 h-8 pr-4 rounded-md" />
        </ToggleGroupItem>
    )
}