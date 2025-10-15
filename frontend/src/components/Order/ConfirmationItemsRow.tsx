import {ToggleGroupItem } from "../ui/toggle-group";



export default function ConfirmationItemsRow({item}: {item: any}) {
    return(
        <ToggleGroupItem value={item.value} className="justify-between">
            <span className="md:text-2xl text-lg px-4">{item.name}</span>
            <img src={item.image} className="md:h-16 h-8 pr-4 rounded-md" />
        </ToggleGroupItem>
    )
}