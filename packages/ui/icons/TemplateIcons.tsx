import { createIcon } from "./createIcon";
import { FaLongArrowAltRight } from "react-icons/fa";
import { MdChevronLeft, MdDescription, MdStar, MdStarOutline } from "react-icons/md";
import { TbTemplateFilled } from "react-icons/tb";

export const BackChevronIcon = createIcon(MdChevronLeft);

export const DefaultTemplateIcon = createIcon(MdStar);

export const MakeDefaultTemplateIcon = createIcon(MdStarOutline);

export const TemplateDocumentIcon = createIcon(MdDescription);

export const TemplateFallbackIcon = createIcon(FaLongArrowAltRight);

export const TemplateTriggerIcon = createIcon(TbTemplateFilled);
