/**
 * Expo UI Jetpack Compose gallery — demos aligned with official SDK 57 docs:
 * https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/#available-components
 */
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AlertDialog,
  AssistChip,
  Badge,
  BadgedBox,
  BasicAlertDialog,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgressIndicator,
  Column,
  DateTimePicker,
  DropdownMenu,
  DropdownMenuItem,
  ElevatedButton,
  ElevatedCard,
  ExtendedFloatingActionButton,
  FilledTonalButton,
  FilterChip,
  FloatingActionButton,
  FlowRow,
  Host,
  HorizontalDivider,
  Icon,
  IconButton,
  LazyColumn,
  LazyRow,
  LinearProgressIndicator,
  ListItem,
  LoadingIndicator,
  ModalBottomSheet,
  NavigationBar,
  NavigationBarItem,
  OutlinedButton,
  OutlinedCard,
  OutlinedTextField,
  PullToRefreshBox,
  RadioButton,
  RNHostView,
  Row,
  SearchBar,
  SegmentedButton,
  Shape,
  SingleChoiceSegmentedButtonRow,
  Slider,
  Snackbar,
  SnackbarHost,
  Spacer,
  Surface,
  Switch,
  Text,
  TextButton,
  TextField,
  ToggleButton,
  TooltipBox,
  type SnackbarHostRef,
} from "@expo/ui/jetpack-compose";
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  size,
  width,
  wrapContentHeight,
  wrapContentWidth,
  Shapes,
} from "@expo/ui/jetpack-compose/modifiers";
import AddIcon from "@expo/material-symbols/add.xml";
import HomeIcon from "@expo/material-symbols/home.xml";
import SettingsIcon from "@expo/material-symbols/settings.xml";

const DOCS =
  "https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose";

function Section({
  name,
  useCase,
  docsPath,
  children,
}: {
  name: string;
  useCase: string;
  docsPath: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-8">
      <RNText className="text-lg font-bold text-neutral-900 dark:text-white">
        {name}
      </RNText>
      <RNText className="mt-1 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
        {useCase}
      </RNText>
      {docsPath ? (
        <Pressable
          onPress={() => void Linking.openURL(`${DOCS}/${docsPath}`)}
          className="mb-3 mt-1 self-start"
        >
          <RNText className="text-xs text-blue-600">Official docs →</RNText>
        </Pressable>
      ) : (
        <View className="mb-3" />
      )}
      {children}
    </View>
  );
}

function ComposeDemo({
  children,
  style,
  matchContents = true,
}: {
  children: ReactNode;
  style?: object;
  matchContents?: boolean | { horizontal: boolean; vertical: boolean };
}) {
  return (
    <Host matchContents={matchContents} style={style}>
      {children}
    </Host>
  );
}

export default function ExpoUiGalleryScreen() {
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(false);
  const [radio, setRadio] = useState<"a" | "b">("a");
  const [slider, setSlider] = useState(0.4);
  const [segment, setSegment] = useState(0);
  const [toggled, setToggled] = useState(false);
  const [filterOn, setFilterOn] = useState(true);
  const [navIndex, setNavIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [showBasicAlert, setShowBasicAlert] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const snackbarRef = useRef<SnackbarHostRef>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  if (Platform.OS !== "android") {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <RNText className="text-center text-base text-neutral-800 dark:text-white">
          Jetpack Compose Expo UI runs on Android. Open this on an emulator or
          device.
        </RNText>
        <Link href="/" className="mt-4 text-blue-600">
          ← Back
        </Link>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-black">
      <StatusBar style="auto" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-16 pt-12">
        <Link href="/" asChild>
          <Pressable className="mb-4 self-start">
            <RNText className="text-sm text-blue-600">← Home</RNText>
          </Pressable>
        </Link>

        <RNText className="text-3xl font-extrabold text-neutral-900 dark:text-white">
          Expo UI gallery
        </RNText>
        <RNText className="mt-2 mb-2 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
          Ordered to match the official{" "}
          <RNText
            className="text-blue-600"
            onPress={() =>
              void Linking.openURL(`${DOCS}/#available-components`)
            }
          >
            available components
          </RNText>{" "}
          list. Demos follow SDK 57 Jetpack Compose docs.
        </RNText>

        {/* —— Host —— */}
        <Section
          name="Host"
          useCase="Required bridge for every Compose tree. Wrap all @expo/ui/jetpack-compose children."
          docsPath="host/"
        >
          <ComposeDemo>
            <Text>Host is wrapping this Text</Text>
          </ComposeDemo>
        </Section>

        {/* —— AlertDialog (official basic example) —— */}
        <Section
          name="AlertDialog"
          useCase="Native confirm dialogs — delete link, discard changes. Slots: Title, Text, ConfirmButton, DismissButton, Icon."
          docsPath="alertdialog/"
        >
          <ComposeDemo>
            <Column verticalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => setShowAlert(true)}>
                <Text>Show Alert</Text>
              </Button>
              {showAlert ? (
                <AlertDialog onDismissRequest={() => setShowAlert(false)}>
                  <AlertDialog.Title>
                    <Text>Confirm Action</Text>
                  </AlertDialog.Title>
                  <AlertDialog.Text>
                    <Text>Are you sure you want to proceed?</Text>
                  </AlertDialog.Text>
                  <AlertDialog.ConfirmButton>
                    <TextButton onClick={() => setShowAlert(false)}>
                      <Text>Confirm</Text>
                    </TextButton>
                  </AlertDialog.ConfirmButton>
                  <AlertDialog.DismissButton>
                    <TextButton onClick={() => setShowAlert(false)}>
                      <Text>Cancel</Text>
                    </TextButton>
                  </AlertDialog.DismissButton>
                </AlertDialog>
              ) : null}
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— Badge (official docs) —— */}
        <Section
          name="Badge"
          useCase="Status dot or count. No children = small indicator; Text child = count label."
          docsPath="badge/"
        >
          <ComposeDemo>
            <Row
              horizontalArrangement={{ spacedBy: 24 }}
              verticalAlignment="center"
            >
              <Badge />
              <Badge containerColor="#EF5350" contentColor="#FFFFFF">
                <Text>3</Text>
              </Badge>
            </Row>
          </ComposeDemo>
        </Section>

        {/* —— BadgedBox (official docs: Badge slot + Icon) —— */}
        <Section
          name="BadgedBox"
          useCase="Overlay a Badge on content (icons, nav items). Put Badge in BadgedBox.Badge slot."
          docsPath="badgedbox/"
        >
          <ComposeDemo>
            <BadgedBox>
              <BadgedBox.Badge>
                <Badge>
                  <Text>5</Text>
                </Badge>
              </BadgedBox.Badge>
              <Icon source={HomeIcon} size={24} tint="#111827" />
            </BadgedBox>
          </ComposeDemo>
        </Section>

        {/* —— BasicAlertDialog —— */}
        <Section
          name="BasicAlertDialog"
          useCase="Blank dialog shell for fully custom layout (unlike structured AlertDialog slots)."
          docsPath="basicalertdialog/"
        >
          <ComposeDemo>
            <Column verticalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => setShowBasicAlert(true)}>
                <Text>Open dialog</Text>
              </Button>
              {showBasicAlert ? (
                <BasicAlertDialog
                  onDismissRequest={() => setShowBasicAlert(false)}
                >
                  <Surface
                    tonalElevation={6}
                    modifiers={[
                      wrapContentWidth(),
                      wrapContentHeight(),
                      clip(Shapes.RoundedCorner(28)),
                    ]}
                  >
                    <Column modifiers={[padding(16, 16, 16, 16)]}>
                      <Text>
                        Custom dialog body — full control over layout.
                      </Text>
                      <Spacer modifiers={[height(24)]} />
                      <TextButton onClick={() => setShowBasicAlert(false)}>
                        <Text>Confirm</Text>
                      </TextButton>
                    </Column>
                  </Surface>
                </BasicAlertDialog>
              ) : null}
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— Box —— */}
        <Section
          name="Box"
          useCase="Stack children on top of each other with contentAlignment."
          docsPath="box/"
        >
          <ComposeDemo>
            <Box
              contentAlignment="center"
              modifiers={[size(200, 120), background("#E0E0E0")]}
            >
              <Text>Centered in Box</Text>
            </Box>
          </ComposeDemo>
        </Section>

        {/* —— Button variants —— */}
        <Section
          name="Button"
          useCase="Material 3 actions: filled, tonal, outlined, elevated, text."
          docsPath="button/"
        >
          <ComposeDemo>
            <Column
              verticalArrangement={{ spacedBy: 8 }}
              modifiers={[fillMaxWidth()]}
            >
              <Button onClick={() => {}}>
                <Text>Filled</Text>
              </Button>
              <FilledTonalButton onClick={() => {}}>
                <Text>Filled tonal</Text>
              </FilledTonalButton>
              <OutlinedButton onClick={() => {}}>
                <Text>Outlined</Text>
              </OutlinedButton>
              <ElevatedButton onClick={() => {}}>
                <Text>Elevated</Text>
              </ElevatedButton>
              <TextButton onClick={() => {}}>
                <Text>Text button</Text>
              </TextButton>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— Card —— */}
        <Section
          name="Card"
          useCase="Group related content — filled, elevated, outlined variants."
          docsPath="card/"
        >
          <ComposeDemo>
            <Column
              verticalArrangement={{ spacedBy: 8 }}
              modifiers={[fillMaxWidth()]}
            >
              <Card modifiers={[fillMaxWidth(), paddingAll(12)]}>
                <Text>Filled card</Text>
              </Card>
              <ElevatedCard modifiers={[fillMaxWidth(), paddingAll(12)]}>
                <Text>Elevated card</Text>
              </ElevatedCard>
              <OutlinedCard modifiers={[fillMaxWidth(), paddingAll(12)]}>
                <Text>Outlined card</Text>
              </OutlinedCard>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— Checkbox —— */}
        <Section
          name="Checkbox"
          useCase="Multi-select options (terms, enable password protection)."
          docsPath="checkbox/"
        >
          <ComposeDemo>
            <Row
              horizontalArrangement={{ spacedBy: 12 }}
              verticalAlignment="center"
            >
              <Checkbox value={checked} onCheckedChange={setChecked} />
              <Text>{checked ? "Checked" : "Unchecked"}</Text>
            </Row>
          </ComposeDemo>
        </Section>

        {/* —— Chip —— */}
        <Section
          name="Chip"
          useCase="AssistChip / FilterChip — compact actions and filters."
          docsPath="chip/"
        >
          <ComposeDemo>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              <AssistChip onClick={() => {}}>
                <AssistChip.Label>
                  <Text>Assist</Text>
                </AssistChip.Label>
              </AssistChip>
              <FilterChip
                selected={filterOn}
                onClick={() => setFilterOn((v) => !v)}
              >
                <FilterChip.Label>
                  <Text>Filter</Text>
                </FilterChip.Label>
              </FilterChip>
            </FlowRow>
          </ComposeDemo>
        </Section>

        {/* —— Column / Row / FlowRow / Spacer —— */}
        <Section
          name="Column / Row / FlowRow / Spacer"
          useCase="Compose layout primitives for arrangement and spacing inside Host."
          docsPath="column/"
        >
          <ComposeDemo>
            <Column modifiers={[fillMaxWidth()]}>
              <Row>
                <Text>Left</Text>
                <Spacer modifiers={[width(16)]} />
                <Text>Right</Text>
              </Row>
              <Spacer modifiers={[height(12)]} />
              <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
                <Text>Flow</Text>
                <Text>items</Text>
                <Text>wrap</Text>
              </FlowRow>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— DateTimePicker —— */}
        <Section
          name="DateTimePicker"
          useCase="Pick dates/times — e.g. link expiry."
          docsPath="datetimepicker/"
        >
          <ComposeDemo
            matchContents={{ horizontal: false, vertical: true }}
            style={{ width: "100%" }}
          >
            <DateTimePicker
              displayedComponents="date"
              onDateSelected={() => {}}
              modifiers={[fillMaxWidth()]}
            />
          </ComposeDemo>
        </Section>

        {/* —— Divider —— */}
        <Section
          name="Divider"
          useCase="HorizontalDivider / VerticalDivider — separate list sections."
          docsPath="divider/"
        >
          <ComposeDemo>
            <Column modifiers={[fillMaxWidth()]}>
              <Text>Above</Text>
              <HorizontalDivider />
              <Text>Below</Text>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— DropdownMenu —— */}
        <Section
          name="DropdownMenu"
          useCase="Overflow menus (edit / copy / delete on a link)."
          docsPath="dropdownmenu/"
        >
          <ComposeDemo>
            <DropdownMenu
              expanded={menuOpen}
              onDismissRequest={() => setMenuOpen(false)}
            >
              <DropdownMenu.Trigger>
                <OutlinedButton onClick={() => setMenuOpen(true)}>
                  <Text>Show Menu</Text>
                </OutlinedButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Items>
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                >
                  <DropdownMenuItem.Text>
                    <Text>Home</Text>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={HomeIcon} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMenuOpen(false)}>
                  <DropdownMenuItem.Text>
                    <Text>Settings</Text>
                  </DropdownMenuItem.Text>
                  <DropdownMenuItem.LeadingIcon>
                    <Icon source={SettingsIcon} size={24} />
                  </DropdownMenuItem.LeadingIcon>
                </DropdownMenuItem>
              </DropdownMenu.Items>
            </DropdownMenu>
          </ComposeDemo>
        </Section>

        {/* —— FAB —— */}
        <Section
          name="FloatingActionButton"
          useCase="Primary floating create action (new short link)."
          docsPath="floatingactionbutton/"
        >
          <ComposeDemo>
            <Row
              horizontalArrangement={{ spacedBy: 16 }}
              verticalAlignment="center"
            >
              <FloatingActionButton onClick={() => {}}>
                <FloatingActionButton.Icon>
                  <Icon source={AddIcon} size={24} />
                </FloatingActionButton.Icon>
              </FloatingActionButton>
              <ExtendedFloatingActionButton onClick={() => {}}>
                <ExtendedFloatingActionButton.Icon>
                  <Icon source={AddIcon} size={24} />
                </ExtendedFloatingActionButton.Icon>
                <ExtendedFloatingActionButton.Text>
                  <Text>Create</Text>
                </ExtendedFloatingActionButton.Text>
              </ExtendedFloatingActionButton>
            </Row>
          </ComposeDemo>
        </Section>

        {/* —— Icon / IconButton —— */}
        <Section
          name="Icon / IconButton"
          useCase="Vector icons and compact icon-only actions."
          docsPath="icon/"
        >
          <ComposeDemo>
            <Row
              horizontalArrangement={{ spacedBy: 16 }}
              verticalAlignment="center"
            >
              <Icon source={SettingsIcon} size={24} tint="#111827" />
              <IconButton onClick={() => {}}>
                <Icon source={AddIcon} size={24} tint="#111827" />
              </IconButton>
            </Row>
          </ComposeDemo>
        </Section>

        {/* —— LazyColumn (finite Host height — official pattern) —— */}
        <Section
          name="LazyColumn"
          useCase="Virtualized vertical lists for long link feeds. Host needs a finite height."
          docsPath="lazycolumn/"
        >
          <ComposeDemo matchContents={false} style={{ height: 220, width: "100%" }}>
            <LazyColumn verticalArrangement={{ spacedBy: 4 }}>
              {Array.from({ length: 20 }, (_, i) => (
                <ListItem key={i}>
                  <ListItem.HeadlineContent>
                    <Text>Item {i + 1}</Text>
                  </ListItem.HeadlineContent>
                </ListItem>
              ))}
            </LazyColumn>
          </ComposeDemo>
        </Section>

        {/* —— LazyRow —— */}
        <Section
          name="LazyRow"
          useCase="Horizontal virtualized lists (filters, chips row)."
          docsPath="lazyrow/"
        >
          <ComposeDemo
            matchContents={{ horizontal: false, vertical: true }}
            style={{ width: "100%", height: 56 }}
          >
            <LazyRow horizontalArrangement={{ spacedBy: 8 }}>
              {["All", "Active", "Paused", "Expired", "Pro"].map((label) => (
                <AssistChip key={label} onClick={() => {}}>
                  <AssistChip.Label>
                    <Text>{label}</Text>
                  </AssistChip.Label>
                </AssistChip>
              ))}
            </LazyRow>
          </ComposeDemo>
        </Section>

        {/* —— ListItem —— */}
        <Section
          name="ListItem"
          useCase="Structured rows — headline, supporting, leading/trailing slots."
          docsPath="listitem/"
        >
          <ComposeDemo>
            <ListItem modifiers={[fillMaxWidth()]}>
              <ListItem.HeadlineContent>
                <Text>xaply.in/demo</Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Text>https://example.com</Text>
              </ListItem.SupportingContent>
              <ListItem.TrailingContent>
                <Text>42</Text>
              </ListItem.TrailingContent>
            </ListItem>
          </ComposeDemo>
        </Section>

        {/* —— Loading / Progress —— */}
        <Section
          name="LoadingIndicator / Progress"
          useCase="Loading and progress feedback while fetching data."
          docsPath="progress/"
        >
          <ComposeDemo>
            <Column
              verticalArrangement={{ spacedBy: 16 }}
              modifiers={[fillMaxWidth()]}
            >
              <LinearProgressIndicator
                progress={0.65}
                modifiers={[fillMaxWidth()]}
              />
              <Row horizontalArrangement={{ spacedBy: 24 }}>
                <CircularProgressIndicator progress={0.65} />
                <LoadingIndicator />
              </Row>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— ModalBottomSheet —— */}
        <Section
          name="ModalBottomSheet"
          useCase="Sheet for create/edit flows without leaving the screen."
          docsPath="bottomsheet/"
        >
          <ComposeDemo>
            <Column verticalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => setShowSheet(true)}>
                <Text>Open sheet</Text>
              </Button>
              {showSheet ? (
                <ModalBottomSheet onDismissRequest={() => setShowSheet(false)}>
                  <Column
                    modifiers={[paddingAll(24), fillMaxWidth()]}
                    verticalArrangement={{ spacedBy: 12 }}
                  >
                    <Text>Sheet content</Text>
                    <Button onClick={() => setShowSheet(false)}>
                      <Text>Close</Text>
                    </Button>
                  </Column>
                </ModalBottomSheet>
              ) : null}
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— NavigationBar —— */}
        <Section
          name="NavigationBar"
          useCase="Material 3 bottom navigation (Links / Analytics / Settings)."
          docsPath="navigationbar/"
        >
          <ComposeDemo
            matchContents={{ horizontal: false, vertical: true }}
            style={{ width: "100%" }}
          >
            <NavigationBar modifiers={[fillMaxWidth()]}>
              <NavigationBarItem
                selected={navIndex === 0}
                onClick={() => setNavIndex(0)}
              >
                <NavigationBarItem.Icon>
                  <Icon source={HomeIcon} size={24} />
                </NavigationBarItem.Icon>
                <NavigationBarItem.Label>
                  <Text>Links</Text>
                </NavigationBarItem.Label>
              </NavigationBarItem>
              <NavigationBarItem
                selected={navIndex === 1}
                onClick={() => setNavIndex(1)}
              >
                <NavigationBarItem.Icon>
                  <Icon source={SettingsIcon} size={24} />
                </NavigationBarItem.Icon>
                <NavigationBarItem.Label>
                  <Text>Settings</Text>
                </NavigationBarItem.Label>
              </NavigationBarItem>
            </NavigationBar>
          </ComposeDemo>
        </Section>

        {/* —— PullToRefreshBox —— */}
        <Section
          name="PullToRefreshBox"
          useCase="Pull-to-refresh around scrollable content (link list)."
          docsPath="pulltorefreshbox/"
        >
          <ComposeDemo matchContents={false} style={{ height: 200, width: "100%" }}>
            <PullToRefreshBox
              isRefreshing={refreshing}
              onRefresh={onRefresh}
            >
              <LazyColumn>
                {["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"].map(
                  (item) => (
                    <ListItem key={item}>
                      <ListItem.HeadlineContent>
                        <Text>{item}</Text>
                      </ListItem.HeadlineContent>
                    </ListItem>
                  )
                )}
              </LazyColumn>
            </PullToRefreshBox>
          </ComposeDemo>
        </Section>

        {/* —— RadioButton —— */}
        <Section
          name="RadioButton"
          useCase="Single choice from a small set."
          docsPath="radiobutton/"
        >
          <ComposeDemo>
            <Column verticalArrangement={{ spacedBy: 8 }}>
              <Row
                horizontalArrangement={{ spacedBy: 8 }}
                verticalAlignment="center"
              >
                <RadioButton
                  selected={radio === "a"}
                  onClick={() => setRadio("a")}
                />
                <Text>Option A</Text>
              </Row>
              <Row
                horizontalArrangement={{ spacedBy: 8 }}
                verticalAlignment="center"
              >
                <RadioButton
                  selected={radio === "b"}
                  onClick={() => setRadio("b")}
                />
                <Text>Option B</Text>
              </Row>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— RNHostView —— */}
        <Section
          name="RNHostView"
          useCase="Embed React Native views inside Compose (e.g. RN Pressable as DropdownMenu trigger)."
          docsPath="rnhostview/"
        >
          <ComposeDemo>
            <RNHostView matchContents>
              <Pressable
                onPress={() => {}}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#111827",
                }}
              >
                <RNText style={{ color: "white", fontWeight: "600" }}>
                  RN Pressable inside Compose
                </RNText>
              </Pressable>
            </RNHostView>
          </ComposeDemo>
        </Section>

        {/* —— SearchBar —— */}
        <Section
          name="SearchBar"
          useCase="Search input for filtering links by slug/title."
          docsPath="searchbar/"
        >
          <ComposeDemo>
            <SearchBar onSearch={() => {}}>
              <SearchBar.Placeholder>Search items...</SearchBar.Placeholder>
            </SearchBar>
          </ComposeDemo>
        </Section>

        {/* —— SegmentedButton —— */}
        <Section
          name="SegmentedButton"
          useCase="Mutually exclusive filters in one row (All / Active / Paused)."
          docsPath="segmentedbutton/"
        >
          <ComposeDemo>
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              {["All", "Active", "Paused"].map((label, index) => (
                <SegmentedButton
                  key={label}
                  selected={segment === index}
                  onClick={() => setSegment(index)}
                >
                  <SegmentedButton.Label>
                    <Text>{label}</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </SingleChoiceSegmentedButtonRow>
          </ComposeDemo>
        </Section>

        {/* —— Shape —— */}
        <Section
          name="Shape"
          useCase="Draw geometric shapes (star, circle, rectangle, pill) — also used as button shapes."
          docsPath="shape/"
        >
          <ComposeDemo>
            <Row
              horizontalArrangement={{ spacedBy: 16 }}
              verticalAlignment="center"
            >
              <Shape.Star color="#FFD700" modifiers={[size(56, 56)]} />
              <Shape.Circle radius={40} color="#4285F4" modifiers={[size(56, 56)]} />
              <Shape.Rectangle color="#34A853" modifiers={[size(56, 56)]} />
              <Shape.Pill color="#EA4335" modifiers={[size(72, 40)]} />
            </Row>
          </ComposeDemo>
        </Section>

        {/* —— Slider —— */}
        <Section
          name="Slider"
          useCase="Continuous value selection."
          docsPath="slider/"
        >
          <ComposeDemo>
            <Column
              verticalArrangement={{ spacedBy: 8 }}
              modifiers={[fillMaxWidth()]}
            >
              <Slider
                value={slider}
                onValueChange={setSlider}
                modifiers={[fillMaxWidth()]}
              />
              <Text>Value: {slider.toFixed(2)}</Text>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— Snackbar —— */}
        <Section
          name="Snackbar"
          useCase="Transient feedback (copied link, saved, error) via SnackbarHost.showSnackbar."
          docsPath="snackbar/"
        >
          <ComposeDemo style={{ minHeight: 120, width: "100%" }}>
            <Column
              modifiers={[fillMaxWidth(), paddingAll(8)]}
              verticalArrangement={{ spacedBy: 12 }}
            >
              <Button
                onClick={() => {
                  void snackbarRef.current?.showSnackbar({
                    message: "Short link copied",
                    actionLabel: "OK",
                    withDismissAction: true,
                  });
                }}
              >
                <Text>Show snackbar</Text>
              </Button>
              <SnackbarHost ref={snackbarRef}>
                <Snackbar />
              </SnackbarHost>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— Surface —— */}
        <Section
          name="Surface"
          useCase="Material surface with tonal/shadow elevation."
          docsPath="surface/"
        >
          <ComposeDemo>
            <Surface
              tonalElevation={2}
              modifiers={[fillMaxWidth(), paddingAll(16)]}
            >
              <Text>Surface content</Text>
            </Surface>
          </ComposeDemo>
        </Section>

        {/* —— Switch —— */}
        <Section
          name="Switch"
          useCase="On/off settings (pause link)."
          docsPath="switch/"
        >
          <ComposeDemo>
            <Row
              horizontalArrangement={{ spacedBy: 12 }}
              verticalAlignment="center"
            >
              <Switch value={switched} onCheckedChange={setSwitched} />
              <Text>{switched ? "On" : "Off"}</Text>
            </Row>
          </ComposeDemo>
        </Section>

        {/* —— Text —— */}
        <Section
          name="Text"
          useCase="Compose text labels. Style via style prop (fontWeight, fontSize, …)."
          docsPath="text/"
        >
          <ComposeDemo>
            <Column verticalArrangement={{ spacedBy: 4 }}>
              <Text>Body text</Text>
              <Text style={{ fontWeight: "bold" }}>Bold text</Text>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— TextField —— */}
        <Section
          name="TextField"
          useCase="Material 3 text inputs — filled and outlined (email, password, URL)."
          docsPath="textfield/"
        >
          <ComposeDemo>
            <Column
              verticalArrangement={{ spacedBy: 12 }}
              modifiers={[fillMaxWidth()]}
            >
              <TextField modifiers={[fillMaxWidth()]}>
                <TextField.Label>
                  <Text>Filled field</Text>
                </TextField.Label>
                <TextField.Placeholder>
                  <Text>Type here</Text>
                </TextField.Placeholder>
              </TextField>
              <OutlinedTextField modifiers={[fillMaxWidth()]} singleLine>
                <OutlinedTextField.Label>
                  <Text>Outlined field</Text>
                </OutlinedTextField.Label>
              </OutlinedTextField>
            </Column>
          </ComposeDemo>
        </Section>

        {/* —— ToggleButton —— */}
        <Section
          name="ToggleButton"
          useCase="Toggleable selected state for view modes / filters."
          docsPath="togglebutton/"
        >
          <ComposeDemo>
            <ToggleButton checked={toggled} onCheckedChange={setToggled}>
              <Text>{toggled ? "Selected" : "Toggle me"}</Text>
            </ToggleButton>
          </ComposeDemo>
        </Section>

        {/* —— Tooltip —— */}
        <Section
          name="Tooltip (TooltipBox)"
          useCase="Long-press contextual hints on buttons/icons."
          docsPath="tooltip/"
        >
          <ComposeDemo>
            <TooltipBox>
              <TooltipBox.PlainTooltip>
                <Text>Add to favorites</Text>
              </TooltipBox.PlainTooltip>
              <Button onClick={() => {}}>
                <Text>Long-press me</Text>
              </Button>
            </TooltipBox>
          </ComposeDemo>
        </Section>

        {/* —— Remaining from available-components —— */}
        <Section
          name="Also in docs (wire when a screen needs them)"
          useCase="Still in the official available-components list — open their doc pages for full APIs."
          docsPath=""
        >
          <View className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
            {(
              [
                ["Carousel", "carousel/", "Scrollable collections of items"],
                [
                  "DockedSearchBar",
                  "dockedsearchbar/",
                  "Inline search input (docked)",
                ],
                [
                  "ExposedDropdownMenuBox",
                  "exposeddropdownmenubox/",
                  "Dropdown with customizable anchor field",
                ],
                [
                  "HorizontalFloatingToolbar",
                  "horizontalfloatingtoolbar/",
                  "Floating action toolbar",
                ],
                [
                  "HorizontalPager",
                  "horizontalpager/",
                  "Swipeable pages",
                ],
              ] as const
            ).map(([name, path, useCase]) => (
              <Pressable
                key={name}
                className="mb-3"
                onPress={() => void Linking.openURL(`${DOCS}/${path}`)}
              >
                <RNText className="font-semibold text-neutral-900 dark:text-white">
                  {name}
                </RNText>
                <RNText className="text-sm text-neutral-600 dark:text-neutral-300">
                  {useCase}
                </RNText>
                <RNText className="text-xs text-blue-600">Docs →</RNText>
              </Pressable>
            ))}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}
