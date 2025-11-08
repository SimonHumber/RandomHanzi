import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();

  return (
    <ScrollView 
        style={styles.container}
        maximumZoomScale={3.0}
        minimumZoomScale={1.0}
        pinchZoomEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chinese Translation Settings</Text>
        <Text style={styles.sectionDescription}>
          Enable or disable which translations to show during Chinese practice (HSK, TOCFL)
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Use Simplified Characters</Text>
            <Text style={styles.settingDescription}>
              Display Simplified instead of Traditional Chinese
            </Text>
          </View>
          <Switch
            value={settings.mainDisplayMode === 'simplified'}
            onValueChange={(value) => updateSetting('mainDisplayMode', value ? 'simplified' : 'traditional')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.mainDisplayMode === 'simplified' ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Alternative Chinese</Text>
            <Text style={styles.settingDescription}>
              Show alternative Chinese characters
            </Text>
          </View>
          <Switch
            value={settings.showSimplified}
            onValueChange={(value) => updateSetting('showSimplified', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showSimplified ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Pinyin</Text>
            <Text style={styles.settingDescription}>
              Show Pinyin pronunciation
            </Text>
          </View>
          <Switch
            value={settings.showPinyin}
            onValueChange={(value) => updateSetting('showPinyin', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showPinyin ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Jyutping</Text>
            <Text style={styles.settingDescription}>
              Show Jyutping (Cantonese) pronunciation
            </Text>
          </View>
          <Switch
            value={settings.showJyutping}
            onValueChange={(value) => updateSetting('showJyutping', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showJyutping ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Han Viet</Text>
            <Text style={styles.settingDescription}>
              Show Han Viet readings
            </Text>
          </View>
          <Switch
            value={settings.showHanViet}
            onValueChange={(value) => updateSetting('showHanViet', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showHanViet ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Vietnamese Translation</Text>
            <Text style={styles.settingDescription}>
              Show Vietnamese meanings
            </Text>
          </View>
          <Switch
            value={settings.showVietnameseTranslation}
            onValueChange={(value) => updateSetting('showVietnameseTranslation', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showVietnameseTranslation ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>English Translation</Text>
            <Text style={styles.settingDescription}>
              Show English meanings
            </Text>
          </View>
          <Switch
            value={settings.showEnglish}
            onValueChange={(value) => updateSetting('showEnglish', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showEnglish ? '#282c34' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Japanese Translation Settings</Text>
        <Text style={styles.sectionDescription}>
          Enable or disable which translations to show during Japanese kanji practice
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>On'yomi</Text>
            <Text style={styles.settingDescription}>
              Show On'yomi (Chinese-derived) readings
            </Text>
          </View>
          <Switch
            value={settings.showOnyomi}
            onValueChange={(value) => updateSetting('showOnyomi', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showOnyomi ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Kun'yomi</Text>
            <Text style={styles.settingDescription}>
              Show Kun'yomi (native Japanese) readings
            </Text>
          </View>
          <Switch
            value={settings.showKunyomi}
            onValueChange={(value) => updateSetting('showKunyomi', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showKunyomi ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Han Viet</Text>
            <Text style={styles.settingDescription}>
              Show Han Viet readings for kanji
            </Text>
          </View>
          <Switch
            value={settings.showKanjiHanViet}
            onValueChange={(value) => updateSetting('showKanjiHanViet', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showKanjiHanViet ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Vietnamese Translation</Text>
            <Text style={styles.settingDescription}>
              Show Vietnamese meanings
            </Text>
          </View>
          <Switch
            value={settings.showKanjiVietnameseTranslation}
            onValueChange={(value) => updateSetting('showKanjiVietnameseTranslation', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showKanjiVietnameseTranslation ? '#282c34' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>English Translation</Text>
            <Text style={styles.settingDescription}>
              Show English meanings
            </Text>
          </View>
          <Switch
            value={settings.showKanjiEnglish}
            onValueChange={(value) => updateSetting('showKanjiEnglish', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showKanjiEnglish ? '#282c34' : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#282c34',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});

