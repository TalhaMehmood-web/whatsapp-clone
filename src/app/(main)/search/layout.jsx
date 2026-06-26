import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { SearchPageList } from "@/features/search/search-page/search-page-list";

export default function SearchLayout({ children }) {
  return <SplitPane list={<SearchPageList />}>{children}</SplitPane>;
}
