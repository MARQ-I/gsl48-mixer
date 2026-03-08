  function calcSimilarity(a, b) {   if (!a || !b) return 0;   const w1 = new Set(a.toLowerCase().replace(/[^\w\s]/g,"").split(/\s+/).filter(w=>w.length>1));   const w2 = new Set(b.toLowerCase().replace(/[^\w\s]/g,"").split(/\s+/).filter(w=>w.length>1));   let n = 0; w1.forEach(w=>{if(w2.has(w))n++;});   return n / Math.max(w1.size, w2.size, 1); }

function PasswordGate({ children }) {
  const [input, setInput] = useState("");
  const [auth, setAuth] = useState(false);
  const [error, setError] = useState(false);
  if (auth) return children;
  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
      <div style={{background:"white",borderRadius:16,padding:48,boxShadow:"0 4px 32px #0001",minWidth:320,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <div style={{fontSize:22,fontWeight:"bold",marginBottom:8,color:"#1e293b"}}>GSL48 シラバス構築ツール</div>
        <div style={{fontSize:14,color:"#64748b",marginBottom:24}}>パスワードを入力してください</div>
        <input type="password" value={input}
          onChange={e=>{setInput(e.target.value);setError(false);}}
          onKeyDown={e=>{if(e.key==="Enter"){if(input===PASSWORD)setAuth(true);else{setError(true);setInput("");}}}}
          placeholder="パスワード"
          style={{width:"100%",padding:"10px 14px",borderRadius:8,fontSize:16,border:error?"2px solid #ef4444":"2px solid #e2e8f0",outline:"none",marginBottom:12,boxSizing:"border-box"}}
          autoFocus />
        {error&&<div style={{color:"#ef4444",fontSize:13,marginBottom:12}}>パスワードが違います</div>}
        <button onClick={()=>{if(input===PASSWORD)setAuth(true);else{setError(true);setInput("");}}}
          style={{width:"100%",padding:12,borderRadius:8,fontSize:16,fontWeight:"bold",background:"#7c3aed",color:"white",border:"none",cursor:"pointer"}}>
          ログイン
        </button>
      </div>
    </div>
  );
}const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

// ===================== GSL48 DATA =====================
const GSL_DATA = {"modules":[{"module_id":"A1","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"AI共生社会の基礎リテラシー","module_name":"2030年世界基準から紐解くAI共生社会の基礎リテラシー","description":"OECD Learning Compass 2030等を基盤に、AI共生社会に求められる基礎リテラシーを体系的に学ぶ。","related_subjects":"社会学、国際関係論、教育学","tags":"#OECD #UNESCO #WellBeing #生成AI"},{"module_id":"A2","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"AI・デジタル化社会の構造分析","module_name":"AI・デジタル化社会の構造分析","description":"プラットフォーム経済、アルゴリズムによる統治など、AIやデジタル技術が社会構造をどう変容させているかを分析する。","related_subjects":"社会学、経営学、経済学","tags":"#AI #デジタル技術 #データサイエンス"},{"module_id":"A3","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"情報と権力のクリティカルリテラシー","module_name":"情報と権力のクリティカルリテラシー","description":"フィルターバブルやフェイクニュース、データ独占などの課題に対し、クリティカルシンキングを用いて構造的に分析する。","related_subjects":"社会学、経済学、政治学","tags":"#情報 #フェイクニュース #メディア"},{"module_id":"A4","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"リスク・インテリジェンス","module_name":"データ・確率・リスクのインテリジェンスリテラシー","description":"統計概念の理解に加え、認知バイアスを学び、AIが出力する予測のリスクと倫理的側面を考察する。","related_subjects":"統計学、データサイエンス","tags":"#統計 #リスク #AI"},{"module_id":"A5","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"AI時代の職業論","module_name":"職業・仕事・プロフェッション論 in AI時代","description":"AIによる労働市場の変化を理解し、人間ならではの価値（創造性、倫理判断等）を再定義する。","related_subjects":"教育学、キャリアデザイン学、心理学","tags":"#労働市場 #キャリアデザイン #倫理"},{"module_id":"A6","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"1/2選択","course_name_ja":"デジタル・ウェルビーイング","module_name":"デジタル・ウェルビーイングとInner Compassデザイン","description":"SNS疲労や情報過多に対処し、自身の価値観に基づいたテクノロジーとの健全な距離感をデザインする。","related_subjects":"心理学、メンタルヘルス学、看護学","tags":"#メンタルヘルス #ウェルビーイング"},{"module_id":"A7","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"メディアトレース入門","module_name":"ニュースの行間を読む：メディアトレース入門","description":"ファクトチェックの基礎技術や、生成AIによる偽情報への対処法を実践的に習得する。","related_subjects":"社会学、メディア学、法学","tags":"#メディア #NEWS #生成AI"},{"module_id":"A8","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"1/2選択","course_name_ja":"未来創造リテラシー","module_name":"世界・未来・Smart Lifeを読む総合ゼミ","description":"最新のテックトレンドを題材に、複数の未来シナリオを検討するフューチャー・リテラシーを養う。","related_subjects":"社会学、教育学","tags":"#スマートライフ #未来"},{"module_id":"A9","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"Inner Compassワークショップ","module_name":"Your Smart Life inner Compassワークショップ","description":"自身の過去・価値観を棚卸しし、AI時代における自らの立ち位置と行動指針を言語化・視覚化する。","related_subjects":"社会学、教育学、経営学","tags":"#インナーコンパス #織学"},{"module_id":"A10","layer_id":"A","layer_name":"Global Inner Compass","recommended_year":1,"default_credits":2,"requirement":"必修","course_name_ja":"SROI（社会投資収益性）","module_name":"社会的投資収益性研究：SROIと倫理的Compass","description":"社会的価値を可視化するSROIの評価手法を学び、倫理的妥当性と社会的インパクトの両立を探求する。","related_subjects":"経済学、経営学、社会学","tags":"#SROI #社会的インパクト #倫理"},{"module_id":"B1","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"必修","course_name_ja":"スマートライフ学概論","module_name":"スマートライフ思想・歴史","description":"過去の生活改善運動や大量消費社会の変遷を辿り、AI時代の「人間らしい生活」を問い直す。","related_subjects":"社会学、生活学、経済学","tags":"#スマートライフ #QOL"},{"module_id":"B2","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"必修","course_name_ja":"QOL研究入門","module_name":"QOL研究入門","description":"WHOの定義やOECDの指標を用い、エビデンスに基づき「良い生活」を多角的に評価・測定する手法を習得する。","related_subjects":"公衆衛生学、幸福学、心理学","tags":"#QOL #WHO #OECD"},{"module_id":"B3","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"3/4つ選択","course_name_ja":"生活者政策と消費者保護","module_name":"生活者政策と国際比較","description":"EU AI Act、GDPR、データ主権などの国際的な政策潮流と、日本の法制度を比較分析する。","related_subjects":"法学、行政学、政治学","tags":"#GDPR #EU AI"},{"module_id":"B4","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"3/4つ選択","course_name_ja":"デジタル時代の社会構造論","module_name":"デジタル時代の社会構造論","description":"デジタル化が雇用・教育・医療等に与える影響を分析し、デジタル格差や包摂の問題を掘り下げる。","related_subjects":"社会学、教育学、政治学","tags":"#雇用 #格差 #DX"},{"module_id":"B5","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"3/4つ選択","course_name_ja":"日本の社会構造と政策","module_name":"日本の社会コンパスI","description":"人口動態、社会保障、災害リスクを学び、自治体の公的統計データを活用した可視化を行う。","related_subjects":"社会学、政治学、統計学","tags":"#人口動態 #社会保障 #防災"},{"module_id":"B6","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"3/4つ選択","course_name_ja":"日本の社会構造と産業","module_name":"日本の社会コンパスII","description":"日本の主要産業におけるDX事例を研究し、雇用形態の変化や地域経済の活性化について考察する。","related_subjects":"経営学、経済学、社会学","tags":"#産業構造 #DX #地域経済"},{"module_id":"B7","layer_id":"B","layer_name":"Smart Life Society","recommended_year":2,"default_credits":2,"requirement":"必修","course_name_ja":"スマートライフ社会フィールドワーク","module_name":"生活文化とSmart Life","description":"衣食住の生活文化、スマートライフの具体像を探求するフィールドワーク","related_subjects":"生活科学、人間科学","tags":"#生活文化 #フィールドワーク"},{"module_id":"C1","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"必修","course_name_ja":"織学概論","module_name":"織学概論とSmart Life inner Compass","description":"専門知識（縦糸）と倫理・価値観（横糸）を交差させ、新たな知を紡ぎ出す独自の方法論を学ぶ。","related_subjects":"哲学、社会学、教育学","tags":"#織学 #倫理 #インナーコンパス"},{"module_id":"C2","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"必修","course_name_ja":"TNマトリクス演習（基礎）","module_name":"TNマトリックス基礎演習","description":"課題を二軸で構造化し、情報の空白領域（Void）を発見して仮説を導き出すフレームワークを習得する。","related_subjects":"フィールドワーク","tags":"#TNマトリクス #構造化"},{"module_id":"C3","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"必修","course_name_ja":"スマートライフデザイン概論","module_name":"Smart Life Design概論","description":"デザイン思考と人間中心設計（HCD）のプロセスを用い、ユーザーの潜在ニーズを発見する手法を学ぶ。","related_subjects":"デザイン学、工学、経営学","tags":"#デザイン思考 #HCD"},{"module_id":"C4","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"1つ選択","course_name_ja":"サービスデザイン入門","module_name":"情報・サービスデザイン入門","description":"UX/UI、カスタマージャーニーマップの作成手法を習得する。","related_subjects":"デザイン学、情報学、経営学","tags":"#UI #UX #サービス設計"},{"module_id":"C5","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"1つ選択","course_name_ja":"リサーチ＆フィールドワーク","module_name":"リサーチ&フィールドワーク方法論","description":"質的・量的調査の基礎を学び、実地でのデータ収集と調査倫理を体験的に学習する。","related_subjects":"社会学、心理学","tags":"#リサーチ #インタビュー"},{"module_id":"C6","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":3,"default_credits":2,"requirement":"1つ選択","course_name_ja":"メディアトレース演習（応用）","module_name":"メディアトレース応用演習","description":"言説分析の手法を用いて、AI倫理や政治対立などの複雑なメディア言説の構造的バイアスを分析する。","related_subjects":"社会学、メディア学、法学","tags":"#AI倫理 #批判的考察"},{"module_id":"C7","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"1つ選択","course_name_ja":"プロジェクトマネジメント for スマートライフ","module_name":"Smart Life Project Management","description":"アジャイル開発手法やガントチャート、リスク管理表など、プロジェクトを完遂するための実務スキルを学ぶ。","related_subjects":"プロジェクトマネジメント","tags":"#アジャイル #ガントチャート"},{"module_id":"C8","layer_id":"C","layer_name":"Smart Life Methods","recommended_year":2,"default_credits":2,"requirement":"1つ選択","course_name_ja":"フューチャーキャスティング","module_name":"Future Casting & Scenario Planning","description":"バックキャスティング手法を用い、AI技術の進化に伴う未来シナリオを戦略的意思決定に落とし込む。","related_subjects":"経営学、心理学","tags":"#バックキャスティング #未来予測"},{"module_id":"D1","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"必修","course_name_ja":"PBL1（スマートライフ導入）","module_name":"Smart Life Implementation Lab I","description":"社会課題の本質的特定（Void発見）と、AI技術を活用した解決策のコンセプト設計を行う。","related_subjects":"すべての学問との接続","tags":"#PBL #社会実装"},{"module_id":"D2","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"必修","course_name_ja":"PBL2（スマートライフ導入）","module_name":"Smart Life Implementation Lab II","description":"40万世帯データ環境や実際のフィールドで解決策を実装・検証し、フィードバックを得る実践PBL。","related_subjects":"すべての学問との接続","tags":"#PBL #プロトタイピング"},{"module_id":"D3","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"1つ選択","course_name_ja":"教育・学び×AI共生プロジェクト","module_name":"教育・学び×AI共生プロジェクト","description":"教育委員会やEdTech企業と連携し、教育現場の課題解決に向けたAI活用モデルを設計・検証する。","related_subjects":"教育学","tags":"#EdTech #学びのDX"},{"module_id":"D4","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"1つ選択","course_name_ja":"地域・自治体×Smart Lifeプロジェクト","module_name":"地域・自治体×Smart Lifeプロジェクト","description":"自治体と連携し、地域課題に対しデジタル技術を用いた解決策を実装する。","related_subjects":"政治学・行政学・公共政策","tags":"#自治体 #地域課題 #防災"},{"module_id":"D5","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"1つ選択","course_name_ja":"企業・働き方×Smart Lifeプロジェクト","module_name":"企業・働き方×Smart Lifeプロジェクト","description":"企業のDX課題に対し、業務効率化と従業員のウェルビーイングを両立するモデルを提案・実証する。","related_subjects":"経営学、情報システム、心理学","tags":"#DX #ウェルビーイング"},{"module_id":"D6","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"1つ選択","course_name_ja":"医療・福祉×Smart Lifeプロジェクト","module_name":"医療・福祉×Smart Lifeプロジェクト","description":"病院や介護施設でPHR活用やケアロボット導入などのソリューションを企画し、倫理的実装力を養う。","related_subjects":"医療・介護・看護・社会福祉","tags":"#医療 #福祉 #ケアロボット"},{"module_id":"D7","layer_id":"D","layer_name":"Implementation & Project","recommended_year":3,"default_credits":2,"requirement":"1つ選択","course_name_ja":"環境・エネルギー×Smart Lifeプロジェクト","module_name":"環境・エネルギー×Smart Lifeプロジェクト","description":"脱炭素とQOL向上の両立を目指し、IoTセンサーを用いたエネルギー行動変容のデザインを行う。","related_subjects":"環境学、情報システム、行政学","tags":"#脱炭素 #エネルギー"},{"module_id":"D8","layer_id":"D","layer_name":"Implementation & Project","recommended_year":4,"default_credits":4,"requirement":"必修","course_name_ja":"修了論文：Global Smart Life Literacy","module_name":"修了論文：Global Smart Life Literacy","description":"4年間の集大成。プロジェクト成果をSROIを用いて評価し、学術的・実務的価値を体系化した論文を執筆する。","related_subjects":"すべての学問との接続","tags":"#SROI #修了論文"}],"layers":[{"layer_id":"A","layer_name":"Global Inner Compass","required_credits":18},{"layer_id":"B","layer_name":"Smart Life Society","required_credits":12},{"layer_id":"C","layer_name":"Smart Life Methods","required_credits":8},{"layer_id":"D","layer_name":"Implementation & Project","required_credits":10}]};

// ===================== QUESTIONS =====================
const QUESTIONS = [
  {id:1,category:"導入環境",icon:"🏫",text:"貴大学のGSL48導入にあたり、カリキュラム改訂の自由度はどの程度ですか？",options:[{label:"既存科目に組み込む（改訂不要）",scores:{short:3,credit1:1,credit2:0}},{label:"一部科目を新設できる（小規模改訂）",scores:{short:1,credit1:3,credit2:1}},{label:"新たな科目群として設計できる（大規模）",scores:{short:0,credit1:1,credit2:3}}]},
  {id:2,category:"担当教員",icon:"👨‍🏫",text:"GSL48を担当できる教員の体制はどの程度整っていますか？",options:[{label:"外部講師・ゲスト登壇が中心になる",scores:{short:3,credit1:1,credit2:0}},{label:"専任教員1〜2名＋外部講師の組み合わせ",scores:{short:1,credit1:3,credit2:1}},{label:"専任教員チームで継続的に運営できる",scores:{short:0,credit1:1,credit2:3}}]},
  {id:3,category:"対象学生",icon:"🎓",text:"GSL48の主な受講対象者はどの段階の学生ですか？",options:[{label:"全学部・全学年（教養・共通科目として）",scores:{short:3,credit1:2,credit2:0}},{label:"特定学部の1〜2年生（入門科目として）",scores:{short:1,credit1:3,credit2:1}},{label:"3〜4年生・大学院生（専門・演習として）",scores:{short:0,credit1:1,credit2:3}}]},
  {id:4,category:"導入ゴール",icon:"🎯",text:"GSL48導入における最優先ゴールは何ですか？",options:[{label:"まず認知・関心を広げるファーストコンタクト",scores:{short:3,credit1:1,credit2:0}},{label:"AI・デジタルリテラシーの基礎を体系的に習得",scores:{short:0,credit1:3,credit2:1}},{label:"社会課題解決型PBL・卒業研究への接続",scores:{short:0,credit1:0,credit2:3}}]},
  {id:5,category:"単位制度",icon:"📋",text:"貴大学の単位付与・履修登録の仕組みはどうなっていますか？",options:[{label:"単位なし・課外活動・セミナー形式で実施可能",scores:{short:3,credit1:0,credit2:0}},{label:"1単位科目として認定できる仕組みがある",scores:{short:1,credit1:3,credit2:0}},{label:"2単位以上の正規科目として組み込める",scores:{short:0,credit1:1,credit2:3}}]},
  {id:6,category:"予算・リソース",icon:"💰",text:"GSL48導入に充てられる予算規模感はどの程度ですか？",options:[{label:"小規模（イベント費・交通費程度）",scores:{short:3,credit1:1,credit2:0}},{label:"中規模（非常勤講師・教材費を確保）",scores:{short:1,credit1:3,credit2:1}},{label:"大規模（専任教員・システム整備含む）",scores:{short:0,credit1:1,credit2:3}}]},
  {id:7,category:"学生の学習負荷",icon:"⏱️",text:"受講学生が授業外に確保できる学習時間はどの程度と想定しますか？",options:[{label:"授業内のみ（予習・復習はほぼ不要）",scores:{short:3,credit1:1,credit2:0}},{label:"週1〜2時間程度（軽い予習・振り返り）",scores:{short:1,credit1:3,credit2:1}},{label:"週3時間以上（リサーチ・レポート・PBL）",scores:{short:0,credit1:1,credit2:3}}]},
  {id:8,category:"既存カリキュラムとの連携",icon:"🔗",text:"既存の専門科目・ゼミとの連携・接続について貴学の方針は？",options:[{label:"独立して完結する単発コンテンツとして導入",scores:{short:3,credit1:1,credit2:0}},{label:"既存科目の補完・関連科目として位置づける",scores:{short:1,credit1:3,credit2:1}},{label:"GSL48をコアに据えた学部横断プログラムを構築",scores:{short:0,credit1:0,credit2:3}}]},
  {id:9,category:"導入スピード",icon:"🚀",text:"GSL48を本格的に稼働させたい時期はいつ頃ですか？",options:[{label:"今学期〜3ヶ月以内に試験実施したい",scores:{short:3,credit1:1,credit2:0}},{label:"来学期〜半年以内にスタートしたい",scores:{short:1,credit1:3,credit2:1}},{label:"次年度以降に本格的なカリキュラム設計",scores:{short:0,credit1:1,credit2:3}}]},
  {id:10,category:"評価・アセスメント",icon:"📊",text:"受講学生の学習成果をどのように評価・アセスメントしますか？",options:[{label:"参加・出席のみ（成績評価なし）",scores:{short:3,credit1:0,credit2:0}},{label:"小レポート・リフレクションシート（軽量な評価）",scores:{short:1,credit1:3,credit2:1}},{label:"最終発表・論文・ポートフォリオによる本格評価",scores:{short:0,credit1:1,credit2:3}}]},
  {id:11,category:"学生募集戦略",icon:"📣",text:"貴大学は今後3年以内に学生募集数を増加させる予定がありますか？",hint:"GSL48は先進カリキュラムとして志願者増・差別化訴求に活用できます",options:[{label:"募集増加の計画はなく、現状維持が基本方針",scores:{short:2,credit1:1,credit2:1}},{label:"志願者増へ新教育コンテンツで差別化・ブランド強化を図りたい",scores:{short:1,credit1:2,credit2:2}},{label:"新学部・新学科設置や定員増など積極的な拡大戦略を推進中",scores:{short:0,credit1:1,credit2:3}}]},
  {id:12,category:"文理融合",icon:"🔬",text:"貴大学では文理融合型の教育・研究プログラムへの取り組みを予定していますか？",hint:"GSL48の「織学」は文系の倫理・社会視点と理系のデータ・AI技術を統合する文理融合の核になります",options:[{label:"現時点では文理別の体制が中心で、融合の計画はない",scores:{short:3,credit1:1,credit2:0}},{label:"一部科目や共同プロジェクトで文理融合を試行的に取り入れたい",scores:{short:1,credit1:3,credit2:2}},{label:"文理融合を教育の柱に位置づけ学部横断プログラムとして本格推進したい",scores:{short:0,credit1:1,credit2:3}}]},
];

// ===================== CONSTANTS =====================
const SESSION_TYPES = [
  {id:"short",   label:"授業",  sub:"2〜6回", sessions:4,  credits:0, icon:"⚡"},
  {id:"credit1", label:"1単位", sub:"8回",    sessions:8,  credits:1, icon:"📘"},
  {id:"credit2", label:"2単位", sub:"16回",   sessions:16, credits:2, icon:"📗"},
];
const SS = {
  short:   {badge:"bg-rose-100 text-rose-700 border border-rose-300",   col:"border-rose-300 bg-rose-50",   hdr:"bg-rose-100",   bar:"bg-rose-400",   text:"text-rose-600",   ring:"ring-rose-400"},
  credit1: {badge:"bg-sky-100 text-sky-700 border border-sky-300",      col:"border-sky-300 bg-sky-50",      hdr:"bg-sky-100",    bar:"bg-sky-500",    text:"text-sky-600",    ring:"ring-sky-400"},
  credit2: {badge:"bg-violet-100 text-violet-700 border border-violet-300",col:"border-violet-300 bg-violet-50",hdr:"bg-violet-100", bar:"bg-violet-500", text:"text-violet-600", ring:"ring-violet-400"},
};
const LC = {
  A:{bg:"bg-violet-50",border:"border-violet-300",badge:"bg-violet-100 text-violet-700 border border-violet-300"},
  B:{bg:"bg-cyan-50",border:"border-cyan-300",badge:"bg-cyan-600 text-white"},
  C:{bg:"bg-emerald-50",border:"border-emerald-300",badge:"bg-emerald-600 text-white"},
  D:{bg:"bg-amber-50",border:"border-amber-300",badge:"bg-amber-600 text-white"},
  X:{bg:"bg-gray-50",border:"border-gray-300",badge:"bg-gray-500 text-white"},
};
const RC = {
  "必修":"bg-red-50 text-red-600 border border-red-300",
  "1/2選択":"bg-blue-50 text-blue-600 border border-blue-300",
  "3/4つ選択":"bg-orange-50 text-orange-600 border border-orange-300",
  "1つ選択":"bg-teal-50 text-teal-600 border border-teal-300",
};
const genId = () => "X"+Math.random().toString(36).slice(2,6).toUpperCase();

// ===================== AI SYLLABUS GENERATOR =====================
async function generateOneSyllabus(module, sessionType) {
  const st = SESSION_TYPES.find(x => x.id === sessionType);
  const creditLabel = st.credits > 0 ? `${st.credits}単位` : "単位なし（課外・体験型）";
  let fmtInstr = "";
  if (sessionType === "short") {
    fmtInstr = `授業型（全2〜6回想定、単位なし）として体験・認知拡大目的の構成にしてください。sessionsは2〜6件で作成してください。assessmentは「なし（参加・出席のみ）」にしてください。`;
  } else if (sessionType === "credit1") {
    fmtInstr = `1単位科目（全8回）として基礎リテラシー習得目的の構成にしてください。sessionsは必ず8件作成してください。`;
  } else {
    fmtInstr = `2単位科目（全16回）として体系的・実践的な学修目的の構成にしてください。sessionsは必ず16件作成してください。前半8回でインプット、後半8回でアウトプット・実践を組み立ててください。`;
  }
  const prompt = `あなたは大学シラバス設計の専門家です。以下のGSL48モジュールについて詳細シラバスをJSONのみで返してください。

【モジュール】科目ID:${module.module_id} / 科目名:${module.course_name_ja} / 概要:${module.description} / 推奨学年:${module.recommended_year}年生
【授業形式】${st.label}(${st.sub}) / ${creditLabel}
${fmtInstr}

以下のJSON形式のみで返答（説明文・マークダウン不要）:
{"course_objectives":["目標1","目標2","目標3"],"teaching_method":"授業形態の説明","sessions":[{"num":1,"title":"第1回タイトル","content":"授業内容（80字程度）","method":"講義/演習/ワーク/フィールド"}],"assessment":"評価方法","materials":["教材1","教材2"],"keywords":["KW1","KW2","KW3"]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body: JSON.stringify({model:"claude-haiku-4-5-20251001", max_tokens:2000, messages:[{role:"user",content:prompt}]})
  });
  const data = await res.json();
  const text = data.content?.map(c=>c.text||"").join("") || "{}";
  const cleaned = text.replace(/```json|```/g,"").trim();
  const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
  if (s===-1||e===-1) throw new Error("JSONが見つかりません");
  const jsonStr = cleaned.slice(s, e+1);
  try {
    return JSON.parse(jsonStr);
  } catch(_) {
    const p = {};
    const om = jsonStr.match(/"course_objectives"\s*:\s*\[([\s\S]*?)\]/);
    if(om){try{p.course_objectives=JSON.parse("["+om[1]+"]");}catch(_){}}
    const mm = jsonStr.match(/"teaching_method"\s*:\s*"([^"]+)"/);
    if(mm) p.teaching_method = mm[1];
    const am = jsonStr.match(/"assessment"\s*:\s*"([^"]+)"/);
    if(am) p.assessment = am[1];
    const sessions=[]; const sr=/\{"num"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]+)"\s*,\s*"method"\s*:\s*"([^"]+)"\s*\}/g;
    let m; while((m=sr.exec(jsonStr))!==null) sessions.push({num:+m[1],title:m[2],content:m[3],method:m[4]});
    if(sessions.length>0) p.sessions = sessions;
    if(Object.keys(p).length===0) throw new Error("JSON解析失敗");
    return p;
  }
}

// ===================== SMALL COMPONENTS =====================
function ModuleCard({module, onAdd, onRemove, isInMix, compact=false}) {
  const lc = LC[module.layer_id]||LC.X;
  return (
    <div className={`rounded-lg border ${lc.border} ${lc.bg} ${compact?"p-2":"p-3"} mb-2`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${lc.badge}`}>{module.module_id}</span>
            {!compact && <span className={`text-xs px-1.5 py-0.5 rounded ${RC[module.requirement]||"bg-gray-100 text-gray-500"}`}>{module.requirement}</span>}
            <span className="text-xs text-gray-500">{module.default_credits}単位</span>
            {module._src==="import" && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">取込</span>}
          </div>
          <p className={`${compact?"text-xs":"text-sm"} font-semibold text-gray-900 leading-tight mb-0.5`}>{module.course_name_ja}</p>
          {!compact && <p className="text-xs text-gray-500 leading-tight line-clamp-2">{module.description}</p>}
        </div>
        <div className="shrink-0">
          {isInMix
            ? <button onClick={()=>onRemove(module)} className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600">除外</button>
            : <button onClick={()=>onAdd(module)} className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700">追加</button>}
        </div>
      </div>
    </div>
  );
}

function MixCard({module, onRemove, onChangeType}) {
  const lc = LC[module.layer_id]||LC.X;
  const stype = module._session_type||"credit2";
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-100 p-2.5 mb-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className={`text-xs font-mono px-1 py-0.5 rounded ${lc.badge}`}>{module.module_id}</span>
            <span className="text-xs text-gray-400">Y{module.recommended_year}</span>
            {module._src==="import" && <span className="text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded">取込</span>}
          </div>
          <p className="text-xs font-semibold text-gray-900 leading-tight mb-1.5">{module.course_name_ja}</p>
          <div className="flex gap-1">
            {SESSION_TYPES.map(st=>(
              <button key={st.id} onClick={()=>onChangeType(module.module_id, st.id)}
                className={`text-xs px-1.5 py-0.5 rounded font-semibold transition-all ${stype===st.id?`${SS[st.id].badge} ring-1 ring-white/20`:"bg-gray-200 text-gray-500 hover:bg-gray-300"}`}>
                {st.icon}{st.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>onRemove(module)} className="text-xs px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 shrink-0">除外</button>
      </div>
    </div>
  );
}

// ===================== STEP 1: 診断 =====================
function Step1Diag({onComplete}) {
  const [answers, setAnswers] = useState({});
  const [page, setPage] = useState("quiz");
  const [result, setResult] = useState(null);
  const count = Object.keys(answers).length;

  const calc = () => {
    const sc = {short:0,credit1:0,credit2:0};
    QUESTIONS.forEach(q=>{const i=answers[q.id]; if(i!=null){const s=q.options[i].scores; sc.short+=s.short; sc.credit1+=s.credit1; sc.credit2+=s.credit2;}});
    const total = sc.short+sc.credit1+sc.credit2||1;
    const pct = {short:Math.round(sc.short/total*100), credit1:Math.round(sc.credit1/total*100), credit2:Math.round(sc.credit2/total*100)};
    const n = GSL_DATA.modules.length;
    const rec = {short:Math.round(pct.short/100*n), credit1:Math.round(pct.credit1/100*n), credit2: n-Math.round(pct.short/100*n)-Math.round(pct.credit1/100*n)};
    const wg=answers[11]>=1, wf=answers[12]>=1;
    let icon,name,desc;
    if(pct.short>=50){icon="🚀";name="スモールスタート型";desc=`体験授業・ゲスト登壇で認知を広げ段階的に浸透させる戦略が最適です。${wg?"　📣 体験型イベントで志願者へ訴求できます。":""}${wf?"　🔬 「織学概論」の単発授業から文理融合の入口を開くことを推奨します。":""}`;}
    else if(pct.credit2>=50){icon="🏛️";name="フルカリキュラム型";desc=`2単位正規科目を中核に据えた本格導入が最適です。${wg?"　📣 正規科目化で入試説明会での強力な差別化訴求になります。":""}${wf?"　🔬 「織学」を文理融合の中核カリキュラムとして位置づけた設計を推奨します。":""}`;}
    else if(pct.credit1>=40){icon="📐";name="バランス導入型";desc=`1単位科目を中心に体験授業と本格科目を組み合わせた段階的導入が最適です。${wg?"　📣 1単位科目の充実で「学べる大学」ブランドを醸成できます。":""}${wf?"　🔬 「織学概論」と「TNマトリクス演習」をコアに文理融合を設計できます。":""}`;}
    else{icon="🔀";name="ハイブリッド型";desc=`3形式を均等に組み合わせた多様性ある設計が向いています。${wg?"　📣 多様な受講形式を「選べるGSL48」として幅広い志願者層へ訴求できます。":""}${wf?"　🔬 文理の学生が混在するハイブリッド型は文理融合の実践の場としても機能します。":""}`;}
    setResult({pct,rec,icon,name,desc,answers:{...answers}});
    setPage("result");
  };

  if (page==="result"&&result) return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-300 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{result.icon}</span>
          <div><p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">診断結果</p>
            <h2 className="text-xl font-bold text-gray-900">{result.name}</h2></div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{result.desc}</p>
      </div>
      {/* Score bars */}
      <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">適性スコア配分</p>
        {SESSION_TYPES.map(st=>(
          <div key={st.id} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">{st.icon} {st.label} <span className="text-gray-500 text-xs">（{st.sub}）</span></span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${SS[st.id].badge}`}>{result.pct[st.id]}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${SS[st.id].bar}`} style={{width:`${result.pct[st.id]}%`}}/>
            </div>
          </div>
        ))}
      </div>
      {/* Rec counts */}
      <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">推奨科目配分（GSL48 全{GSL_DATA.modules.length}科目）</p>
        <div className="grid grid-cols-3 gap-3">
          {SESSION_TYPES.map(st=>(
            <div key={st.id} className={`rounded-xl border ${SS[st.id].col} p-3 text-center`}>
              <p className="text-2xl mb-1">{st.icon}</p>
              <p className="text-sm font-bold text-gray-900">{st.label}</p>
              <p className="text-xs text-gray-500 mb-1">{st.sub}</p>
              <p className="text-3xl font-bold text-gray-900">{result.rec[st.id]}</p>
              <p className="text-xs text-gray-400">科目</p>
              {st.credits>0&&<p className="text-xs text-gray-500 mt-1">{result.rec[st.id]*st.credits}単位</p>}
              {st.id==="short"&&<p className="text-xs text-gray-500 mt-1">単位なし</p>}
            </div>
          ))}
        </div>
      </div>
      {/* Answers summary */}
      <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">回答サマリー</p>
        {QUESTIONS.map(q=>{const i=answers[q.id];if(i==null)return null;return(
          <div key={q.id} className="mb-1.5 pb-1.5 border-b border-gray-200 last:border-0">
            <p className="text-xs text-gray-400">{q.icon} Q{q.id}. {q.category}</p>
            <p className="text-xs text-gray-600">→ {q.options[i].label}</p>
          </div>
        );})}
      </div>
      <div className="flex gap-3">
        <button onClick={()=>setPage("quiz")} className="flex-1 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-sm font-semibold text-gray-900">🔄 再診断</button>
        <button onClick={()=>onComplete(result)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-emerald-700 hover:from-violet-600 hover:to-emerald-600 text-sm font-bold text-white shadow-lg">
          次のステップへ →
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">GSL48 導入適性 問診票</h2>
            <p className="text-xs text-gray-500">{QUESTIONS.length}問に答えると最適な導入形式を診断します</p>
          </div>
          <span className="text-xs text-gray-500">{count}/{QUESTIONS.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all" style={{width:`${count/QUESTIONS.length*100}%`}}/>
        </div>
      </div>
      {QUESTIONS.map(q=>{
        const ans = answers[q.id];
        return (
          <div key={q.id} className={`rounded-xl border mb-3 overflow-hidden ${ans!=null?"border-gray-300 bg-gray-100":"border-gray-300 bg-gray-50"}`}>
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ans!=null?"bg-violet-600 text-white":"bg-gray-200 text-gray-500"}`}>{q.id}</span>
              <span className="text-xs text-gray-500 font-semibold">{q.icon} {q.category}</span>
              {ans!=null&&<span className="ml-auto text-xs text-violet-600">✓</span>}
            </div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-sm font-semibold text-gray-900 mb-1 leading-relaxed">{q.text}</p>
              {q.hint&&<p className="text-xs text-amber-600 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 mb-2.5">💡 {q.hint}</p>}
              {!q.hint&&<div className="mb-2.5"/>}
              <div className="space-y-2">
                {q.options.map((opt,oi)=>{
                  const sel = ans===oi;
                  const dom = Object.entries(opt.scores).sort((a,b)=>b[1]-a[1])[0][0];
                  return (
                    <button key={oi} onClick={()=>setAnswers(a=>({...a,[q.id]:oi}))}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${sel?`${SS[dom].col} ${SS[dom].ring} ring-1 text-gray-900 font-semibold`:"border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sel?"border-white bg-white":"border-slate-500"}`}>
                          {sel&&<span className="w-2 h-2 rounded-full bg-gray-50 block"/>}
                        </span>
                        <span className="flex-1">{opt.label}</span>
                        {sel&&<span className="ml-auto flex gap-1 shrink-0">{SESSION_TYPES.map(st=>opt.scores[st.id]>0&&<span key={st.id} className={`text-xs px-1 py-0.5 rounded ${SS[st.id].badge}`}>{st.icon}{opt.scores[st.id]}</span>)}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-4 pb-4">
        <button onClick={calc} disabled={count<QUESTIONS.length}
          className={`w-full py-3 rounded-xl text-sm font-bold ${count===QUESTIONS.length?"bg-violet-600 hover:bg-violet-500 text-white shadow-lg":"bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          {count<QUESTIONS.length?`あと ${QUESTIONS.length-count} 問回答してください`:"🔍 診断結果を見る"}
        </button>
      </div>
    </div>
  );
}

// ===================== STEP 2: 取込み =====================
function Step2Import({importedModules, setImportedModules, onComplete, log}) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef();

  const autoMap = keys => {
    const f=(...h)=>keys.find(k=>h.some(x=>k.toLowerCase().includes(x.toLowerCase())))||"";
    return{id:f("module_id","科目ID","id"),layer:f("layer_id","layer","レイヤー"),year:f("year","学年"),credits:f("credits","単位"),req:f("requirement","履修区分"),name_ja:f("course_name_ja","科目名","授業名"),name_en:f("module_name","英語名"),name:f("name","名称"),desc:f("description","概要"),related:f("related","関連"),tags:f("tags","タグ")};
  };

  const parseExcel = async file => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf,{type:"array"});
    let found = 0;
    for (const sn of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:""});
      if(!rows.length) continue;
      const mp = autoMap(Object.keys(rows[0]));
      const mods = rows.map((r,i)=>({
        module_id:String(r[mp.id]||genId()), layer_id:String(r[mp.layer]||"X"),
        recommended_year:parseInt(r[mp.year])||1, default_credits:parseInt(r[mp.credits])||2,
        requirement:String(r[mp.req]||""), course_name_ja:String(r[mp.name_ja]||r[mp.name]||`科目${i+1}`),
        module_name:String(r[mp.name_en]||r[mp.name]||""), description:String(r[mp.desc]||""),
        related_subjects:String(r[mp.related]||""), tags:String(r[mp.tags]||""),
        _src:"import", _file:file.name,
      })).filter(x=>x.course_name_ja&&x.course_name_ja!=="undefined");
      setImportedModules(p=>[...p,...mods]); found+=mods.length;
    }
    log(`✅ Excel取込: ${found}科目（${file.name}）`);
  };

  const parseWithClaude = async (file, ext) => {
    log(`🤖 AI解析中: ${file.name}`);
    const b64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej(new Error("読込失敗"));r.readAsDataURL(file);});
    const mt = ext==="pdf"?"application/pdf":"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:4000,messages:[{role:"user",content:[
        {type:"document",source:{type:"base64",media_type:mt,data:b64}},
        {type:"text",text:`このシラバスから全科目をJSON配列のみで抽出してください:\n[{"module_id":"","layer_id":"X","course_name_ja":"","module_name":"","recommended_year":1,"default_credits":2,"requirement":"","description":"","related_subjects":"","tags":""}]`}
      ]}]})});
    const data = await res.json();
    const text = data.content?.map(c=>c.text||"").join("")||"";
    const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
    setImportedModules(p=>[...p,...parsed.map(m=>({...m,_src:"import",_file:file.name}))]);
    log(`✅ AI取込: ${parsed.length}科目（${file.name}）`);
  };

  const handleFile = useCallback(async e => {
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    setLoading(true);
    for (const file of files) {
      try {
        const ext = file.name.split(".").pop().toLowerCase();
        if(ext==="xlsx"||ext==="xls") await parseExcel(file);
        else if(ext==="pdf"||ext==="docx"||ext==="doc") await parseWithClaude(file, ext);
        else log(`⚠️ 非対応形式: ${file.name}`);
      } catch(e) { log(`❌ エラー: ${file.name} — ${e.message}`); }
    }
    setLoading(false);
    e.target.value="";
  },[]);

  const filtered = importedModules.filter(m=>!search||m.course_name_ja?.includes(search)||m.description?.includes(search)||m.module_id?.includes(search));
  const byFile = filtered.reduce((acc,m)=>{const k=m._file||"不明";(acc[k]=acc[k]||[]).push(m);return acc;},{});

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Upload area */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50 transition-all"
          onClick={()=>fileRef.current?.click()}>
          {loading
            ? <><p className="text-2xl mb-2 animate-bounce">⏳</p><p className="text-sm font-bold text-violet-600">AI解析中...</p><p className="text-xs text-gray-400">しばらくお待ちください</p></>
            : <><p className="text-3xl mb-2">📂</p><p className="text-sm font-bold text-gray-900 mb-1">ここをクリック or ファイルをドロップ</p><p className="text-xs text-gray-500">Excel (.xlsx/.xls) · PDF · Word (.docx) に対応</p><p className="text-xs text-gray-400 mt-1">複数ファイルを一度に選択可能</p></>
          }
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.pdf,.docx,.doc" multiple onChange={handleFile} className="hidden" disabled={loading}/>
        {importedModules.length>0&&(
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-amber-700 font-semibold">✅ {importedModules.length}科目を取込済み</span>
            <button onClick={()=>setImportedModules([])} className="text-xs text-red-500 hover:text-red-600">🗑 すべてクリア</button>
          </div>
        )}
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto p-4">
        {importedModules.length===0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3 opacity-40">🏫</p>
            <p className="text-gray-500 font-semibold text-sm mb-1">まだファイルが取込まれていません</p>
            <p className="text-gray-400 text-xs">取込まずにスキップして<br/>GSL48のみでミックスすることも可能です</p>
          </div>
        ) : (
          <>
            <input placeholder="科目名・キーワードで検索..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 mb-3 focus:outline-none focus:border-violet-500"/>
            {Object.entries(byFile).map(([fname, mods])=>(
              <div key={fname} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-mono">{fname}</span>
                  <span className="text-xs text-gray-400">{mods.length}科目</span>
                </div>
                {mods.map((m,i)=>(
                  <div key={i} className={`rounded-lg border ${LC[m.layer_id]?.border||"border-gray-300"} ${LC[m.layer_id]?.bg||"bg-gray-50"} p-2.5 mb-1.5`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${LC[m.layer_id]?.badge||"bg-slate-600 text-slate-100"}`}>{m.module_id}</span>
                          <span className="text-xs text-gray-500">{m.default_credits}単位</span>
                          {m.recommended_year>0&&<span className="text-xs text-gray-400">Y{m.recommended_year}</span>}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{m.course_name_ja}</p>
                        {m.description&&<p className="text-xs text-gray-500 leading-tight line-clamp-1 mt-0.5">{m.description}</p>}
                      </div>
                      <button onClick={()=>setImportedModules(p=>p.filter((_,j)=>p.indexOf(m)!==j))}
                        className="text-xs text-gray-400 hover:text-red-500 shrink-0">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer nav */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
        <button onClick={onComplete}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-700 to-emerald-700 hover:from-violet-600 hover:to-emerald-600 text-sm font-bold text-white shadow-lg">
          {importedModules.length>0 ? `${importedModules.length}科目を取込んでミックスへ →` : "スキップしてミックスへ →"}
        </button>
      </div>
    </div>
  );
}

// ===================== STEP 3: ミックス＆生成 =====================
function Step3Mix({mixModules, setMixModules, gslModules, importedModules, generatedSyllabi, setGeneratedSyllabi, diagResult, log}) {
  const [subTab, setSubTab] = useState("mix");
  const [genState, setGenState] = useState("idle");
  const [progress, setProgress] = useState({done:0,total:0,current:""});
  const [viewType, setViewType] = useState("credit2");
  const [expandedId, setExpandedId] = useState(null);
  const [searchMix, setSearchMix] = useState("");
  const [searchGSL, setSearchGSL] = useState("");
  const [searchImport, setSearchImport] = useState("");
  const [filterLayer, setFilterLayer] = useState("ALL");
  const [newCourse, setNewCourse] = useState(false);

  const mixIds = new Set(mixModules.map(m=>m.module_id));
  const addToMix = m => setMixModules(p=>[...p,{...m,_session_type:"credit2"}]);
  const removeFromMix = m => setMixModules(p=>p.filter(x=>x.module_id!==m.module_id));
  const changeType = (id,t) => setMixModules(p=>p.map(m=>m.module_id===id?{...m,_session_type:t}:m));
  const byType = id => mixModules.filter(m=>(m._session_type||"credit2")===id);
  const filt = (list,s,layer) => {
    let r=list;
    if(s) r=r.filter(m=>m.course_name_ja?.includes(s)||m.description?.includes(s)||m.module_id?.includes(s));
    if(layer!=="ALL") r=r.filter(m=>m.layer_id===layer);
    return r;
  };

  const startGenerate = async () => {
    setGenState("generating");
    const all=[...mixModules];
    setProgress({done:0,total:all.length,current:""});
    const results={};
    for(let i=0;i<all.length;i++){
      const m=all[i], stype=m._session_type||"credit2";
      setProgress({done:i,total:all.length,current:m.course_name_ja});
      try{
        const similar=importedModules.find(im=>calcSimilarity((im.course_name_ja||"")+(im.description||""),( m.course_name_ja||"")+(m.description||""))>0.3);         const s=similar?{course_objectives:[similar.description||"大学シラバスより"],teaching_method:similar.course_name_ja||"",sessions:[{num:1,title:similar.course_name_ja||"",content:similar.description||""}],assessment:"大学シラバス準拠",_source:"university"}:await generateOneSyllabus(m,stype);
        results[m.module_id]={...s,_session_type:stype,_module:m};
        log(`✅ 生成: ${m.module_id} ${m.course_name_ja}`);
      }catch(e){
        results[m.module_id]={_error:e.message,_session_type:stype,_module:m};
        log(`⚠️ 失敗: ${m.module_id}`);
      }
      if(i<all.length-1) await new Promise(r=>setTimeout(r,300));
    }
    setGeneratedSyllabi(results);
    setProgress({done:all.length,total:all.length,current:"完了"});
    setGenState("done");
    log(`🎉 全${all.length}科目のシラバス生成完了`);
  };

  const exportAll = () => {
    const wb=XLSX.utils.book_new();
    SESSION_TYPES.forEach(st=>{
      const mods=byType(st.id);
      const rows=[["科目ID","ソース","科目名","学習目標","授業方法","各回タイトル","評価方法","教材","キーワード"]];
      mods.forEach(m=>{
        const s=generatedSyllabi[m.module_id];
        if(!s||s._error){rows.push([m.module_id,m._src||"gsl",m.course_name_ja,"（生成未完了）","","","","",""]);return;}
        rows.push([m.module_id,m._src||"gsl",m.course_name_ja,(s.course_objectives||[]).join("／"),s.teaching_method||"",(s.sessions||[]).map((ss,i)=>`${ss.num||i+1}.${ss.title}`).join("\n"),s.assessment||"",(s.materials||[]).join("、"),(s.keywords||[]).join("、")]);
      });
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),`${st.label}(${st.sub})`);
    });
    const dc=[["科目ID","ソース","科目名","形式","回","タイトル","内容","形態"]];
    Object.values(generatedSyllabi).forEach(s=>{
      if(!s._module||s._error)return;
      const st=SESSION_TYPES.find(x=>x.id===s._session_type);
      (s.sessions||[]).forEach(ss=>dc.push([s._module.module_id,s._module._src||"gsl",s._module.course_name_ja,st?.label||"",ss.num||"",ss.title||"",ss.content||"",ss.method||""]));
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(dc),"全授業回別詳細");
    XLSX.writeFile(wb,`gsl48_mixed_syllabi_${new Date().toISOString().slice(0,10)}.xlsx`);
    log(`📥 Export完了`);
  };

  const genCount = Object.keys(generatedSyllabi).length;
  const pct = progress.total>0?Math.round(progress.done/progress.total*100):0;
  const totalCredits = mixModules.reduce((s,m)=>{const t=SESSION_TYPES.find(x=>x.id===(m._session_type||"credit2"));return s+(t?.credits||0);},0);

  const SubBtn=({id,label,cnt,active})=>(
    <button onClick={()=>setSubTab(id)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${active?"bg-gray-200 text-gray-900":"text-gray-400 hover:text-gray-600"}`}>
      {label}{cnt!=null&&<span className="ml-1 opacity-60">({cnt})</span>}
    </button>
  );

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left panel: source browsers */}
      <div className="w-72 border-r border-gray-200 flex flex-col min-h-0 shrink-0">
        {/* Sub-nav */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-white shrink-0">
          <SubBtn id="gsl48" label="GSL48" cnt={gslModules.length} active={subTab==="gsl48"}/>
          <SubBtn id="imported" label="取込済" cnt={importedModules.length} active={subTab==="imported"}/>
        </div>
        {/* Layer filter */}
        <div className="flex gap-1 px-3 py-2 border-b border-gray-200 shrink-0 overflow-x-auto">
          {["ALL","A","B","C","D"].map(id=>(
            <button key={id} onClick={()=>setFilterLayer(id)}
              className={`text-xs px-2 py-1 rounded shrink-0 ${filterLayer===id?"bg-violet-600 text-white":"bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {id}
            </button>
          ))}
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {subTab==="gsl48"&&(
            <>
              <input placeholder="検索..." value={searchGSL} onChange={e=>setSearchGSL(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 mb-2 focus:outline-none focus:border-violet-500"/>
              {filt(gslModules,searchGSL,filterLayer).map(m=>(
                <ModuleCard key={m.module_id} module={m} isInMix={mixIds.has(m.module_id)} onAdd={addToMix} onRemove={removeFromMix} compact/>
              ))}
            </>
          )}
          {subTab==="imported"&&(
            importedModules.length===0
              ? <div className="text-center py-8 text-gray-400 text-xs">取込科目なし</div>
              : <>
                  <input placeholder="検索..." value={searchImport} onChange={e=>setSearchImport(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 mb-2 focus:outline-none focus:border-violet-500"/>
                  {filt(importedModules,searchImport,filterLayer).map((m,i)=>(
                    <ModuleCard key={i} module={m} isInMix={mixIds.has(m.module_id)} onAdd={addToMix} onRemove={removeFromMix} compact/>
                  ))}
                </>
          )}
        </div>
      </div>

      {/* Right panel: mix + generate */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          {[{id:"mix",label:"ミックス結果",cnt:mixModules.length},{id:"generate",label:"自動生成",cnt:genCount>0?genCount:null}].map(t=>(
            <button key={t.id} onClick={()=>setSubTab(t.id)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg border-b-2 transition-all ${subTab===t.id?"border-violet-400 text-violet-600 bg-gray-100":"border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t.label}{t.cnt!=null&&<span className="ml-1.5 text-xs opacity-60">({t.cnt})</span>}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-gray-100 rounded px-2 py-1">{mixModules.length}科目</span>
            <span className="bg-gray-100 rounded px-2 py-1">{totalCredits}単位</span>
          </div>
        </div>

        {/* MIX SUB-TAB */}
        {(subTab==="mix"||subTab==="gsl48"||subTab==="imported")&&(
          <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <input placeholder="ミックス内を検索..." value={searchMix} onChange={e=>setSearchMix(e.target.value)}
                className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-violet-500 placeholder-gray-400"/>
              <button onClick={()=>setSubTab("generate")}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-700 to-emerald-700 hover:from-violet-600 hover:to-emerald-600 text-xs font-bold text-white shrink-0">
                🚀 自動生成へ
              </button>
            </div>
            <div className="flex gap-3 flex-1 min-h-0">
              {SESSION_TYPES.map(st=>{
                const mods=filt(byType(st.id),searchMix,filterLayer);
                const allMods=byType(st.id);
                const totalSess = st.id==="short"?null:allMods.length*st.sessions;
                return(
                  <div key={st.id} className={`flex-1 rounded-xl border ${SS[st.id].col} flex flex-col min-h-0`}>
                    <div className={`p-3 ${SS[st.id].hdr} rounded-t-xl border-b ${SS[st.id].col} shrink-0`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{st.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{st.label}</p>
                            <p className="text-xs text-gray-500">{st.id==="short"?"2〜6回／科目":`${st.sessions}回／科目`}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${SS[st.id].badge}`}>{allMods.length}科目</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-gray-50 rounded px-2 py-1.5 text-center">
                          <p className="text-xs text-gray-400">単位計</p>
                          <p className={`font-bold text-sm ${st.id==="short"?"text-gray-400":"text-gray-900"}`}>
                            {st.id==="short"?"なし":`${allMods.length*st.credits}単位`}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded px-2 py-1.5 text-center">
                          <p className="text-xs text-gray-400">総授業数</p>
                          <p className="font-bold text-gray-900 text-sm">
                            {st.id==="short"?`${allMods.length*2}〜${allMods.length*6}回`:`${totalSess}回`}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-1.5 rounded px-2 py-1 text-center text-xs border ${SS[st.id].col} ${st.id==="short"?"border-rose-200":st.id==="credit1"?"border-sky-200":"border-violet-200"}`}>
                        {st.id==="short"&&<span className="text-gray-500">1科目 <span className="text-rose-300 font-bold">2〜6回</span>（体験・認知拡大）</span>}
                        {st.id==="credit1"&&<span className="text-gray-500">1科目 <span className="text-sky-600 font-bold">8回</span> × {allMods.length}科目 ＝ <span className="text-gray-900 font-bold">{totalSess}回</span></span>}
                        {st.id==="credit2"&&<span className="text-gray-500">1科目 <span className="text-violet-600 font-bold">16回</span> × {allMods.length}科目 ＝ <span className="text-gray-900 font-bold">{totalSess}回</span></span>}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {mods.length===0?<p className="text-xs text-gray-400 text-center py-8">科目なし</p>
                        :mods.map((m,i)=><MixCard key={`${m.module_id}-${i}`} module={m} onRemove={removeFromMix} onChangeType={changeType}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GENERATE SUB-TAB */}
        {subTab==="generate"&&(
          <div className="flex-1 flex flex-col min-h-0">
            {/* Control bar */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 shrink-0">
              {genState==="idle"&&(
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">📝 シラバス自動生成</p>
                    <p className="text-xs text-gray-500">ミックス済み {mixModules.length}科目のシラバスをAIで一括生成します</p>
                    <div className="flex gap-2 mt-1">
                      {SESSION_TYPES.map(st=>(
                        <span key={st.id} className={`text-xs px-2 py-0.5 rounded ${SS[st.id].badge}`}>{st.icon} {st.label}: {byType(st.id).length}科目</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={startGenerate}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shrink-0 shadow-lg shadow-violet-300/40">
                    ⚡ 生成スタート
                  </button>
                </div>
              )}
              {genState==="generating"&&(
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">🤖 AI生成中… {progress.done}/{progress.total}科目</p>
                    <span className="text-xs text-violet-600">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{width:`${pct}%`}}/>
                  </div>
                  {progress.current&&<p className="text-xs text-gray-500">処理中: {progress.current}</p>}
                </div>
              )}
              {genState==="done"&&(
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-600">✅ 生成完了 — {genCount}科目</p>
                    <p className="text-xs text-gray-500">授業形式別に確認 · Exportできます</p>
                  </div>
                  <button onClick={exportAll} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shrink-0">📥 Excel Export</button>
                  <button onClick={()=>setGenState("idle")} className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm shrink-0">🔄 再生成</button>
                </div>
              )}
            </div>
            {/* Type tabs for done state */}
            {genState==="done"&&(
              <div className="flex border-b border-gray-200 bg-gray-50 px-4 shrink-0">
                {SESSION_TYPES.map(st=>(
                  <button key={st.id} onClick={()=>setViewType(st.id)}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${viewType===st.id?`border-current ${SS[st.id].text}`:"border-transparent text-gray-400 hover:text-gray-600"}`}>
                    {st.icon} {st.label}<span className="text-xs opacity-60">({byType(st.id).length})</span>
                  </button>
                ))}
              </div>
            )}
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {genState==="idle"&&(
                <div className="text-center py-12">
                  <p className="text-5xl mb-4">📝</p>
                  <p className="text-gray-900 font-bold text-lg mb-2">シラバス自動生成</p>
                  <p className="text-gray-500 text-sm mb-6">ミックスした科目からClaude AIが<br/>各科目のシラバスを自動作成します</p>
                  <div className="inline-grid grid-cols-3 gap-3 text-left">
                    {SESSION_TYPES.map(st=>(
                      <div key={st.id} className={`rounded-xl border ${SS[st.id].col} p-3`}>
                        <p className="text-xl mb-1">{st.icon}</p>
                        <p className="font-bold text-gray-900 text-sm">{st.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{byType(st.id).length}<span className="text-xs font-normal text-gray-500"> 科目</span></p>
                        <p className="text-xs text-gray-500 mt-1">{st.id==="short"?"2〜6回構成":st.id==="credit1"?"8回構成":"16回構成（前半IN/後半OUT）"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {genState==="generating"&&(
                <div className="space-y-1.5">
                  {mixModules.map((m,i)=>{
                    const done=i<progress.done, cur=i===progress.done;
                    const lc=LC[m.layer_id]||LC.X;
                    return(
                      <div key={m.module_id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${done?"border-emerald-300 bg-emerald-50":cur?"border-violet-400 bg-violet-50":"border-gray-200 bg-gray-50"}`}>
                        <span className={`text-base shrink-0 ${done?"opacity-100":cur?"animate-pulse":"opacity-20"}`}>{done?"✅":cur?"⚙️":"⏳"}</span>
                        <span className={`text-xs font-mono px-1 py-0.5 rounded ${lc.badge} shrink-0`}>{m.module_id}</span>
                        <span className={`text-sm flex-1 ${done?"text-emerald-600":cur?"text-gray-900":"text-gray-400"}`}>{m.course_name_ja}</span>
                        <span className={`text-xs shrink-0 ${SS[m._session_type||"credit2"].badge} px-1.5 py-0.5 rounded`}>{SESSION_TYPES.find(s=>s.id===(m._session_type||"credit2"))?.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {genState==="done"&&(
                <div className="space-y-3">
                  {byType(viewType).map(m=>{
                    const s=generatedSyllabi[m.module_id];
                    const lc=LC[m.layer_id]||LC.X;
                    const st=SESSION_TYPES.find(x=>x.id===viewType);
                    const open=expandedId===m.module_id;
                    if(!s) return null;
                    return(
                      <div key={m.module_id} className={`rounded-xl border ${SS[viewType].col} overflow-hidden`}>
                        <button className="w-full text-left px-4 py-3 flex items-center gap-2" onClick={()=>setExpandedId(open?null:m.module_id)}>
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${lc.badge} shrink-0`}>{m.module_id}</span>
                          {m._src==="import"&&<span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">取込</span>}
                          <span className="text-sm font-bold text-gray-900 flex-1 truncate">{m.course_name_ja}</span>
                          <span className="text-xs text-gray-500 shrink-0">{st?.sub}</span>
                          {s._error?<span className="text-xs text-red-500 shrink-0">❌</span>:<span className="text-xs text-emerald-600 shrink-0">✅</span>}
                          <span className="text-gray-400 text-xs ml-1">{open?"▲":"▼"}</span>
                        </button>
                        {open&&!s._error&&(
                          <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                            {s.course_objectives?.length>0&&(
                              <div className="mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">📌 学習目標</p>
                                <ul className="space-y-1">{s.course_objectives.map((o,i)=><li key={i} className="text-xs text-slate-200 flex gap-2"><span className={`${SS[viewType].text} font-bold shrink-0`}>{i+1}.</span>{o}</li>)}</ul>
                              </div>
                            )}
                            {s.teaching_method&&<div className="mb-3"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">🎓 授業形態</p><p className="text-xs text-gray-600">{s.teaching_method}</p></div>}
                            {s.sessions?.length>0&&(
                              <div className="mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">📅 授業構成（全{s.sessions.length}回）</p>
                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                  {s.sessions.map((ss,i)=>(
                                    <div key={i} className="flex gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5">
                                      <span className={`text-xs font-bold ${SS[viewType].text} w-6 shrink-0`}>#{ss.num||i+1}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 leading-tight">{ss.title}</p>
                                        <p className="text-xs text-gray-500 leading-tight mt-0.5">{ss.content}</p>
                                      </div>
                                      {ss.method&&<span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded shrink-0 h-fit">{ss.method}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {s.assessment&&<div className="mb-3"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">📊 評価方法</p><p className="text-xs text-gray-600">{s.assessment}</p></div>}
                            <div className="grid grid-cols-2 gap-3">
                              {s.materials?.length>0&&<div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">📚 教材</p><ul className="space-y-0.5">{s.materials.map((mt,i)=><li key={i} className="text-xs text-gray-500">• {mt}</li>)}</ul></div>}
                              {s.keywords?.length>0&&<div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">🏷️ キーワード</p><div className="flex flex-wrap gap-1">{s.keywords.map((kw,i)=><span key={i} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{kw}</span>)}</div></div>}
                            </div>
                          </div>
                        )}
                        {open&&s._error&&<div className="border-t border-gray-200 px-4 py-3"><p className="text-xs text-red-500">エラー: {s._error}</p></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
export default function SyllabusMixer() {
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [diagResult, setDiagResult] = useState(null);
  const [importedModules, setImportedModules] = useState([]);
  const [mixModules, setMixModules] = useState(GSL_DATA.modules.map(m=>({...m,_src:"gsl",_session_type:"credit2"})));
  const [generatedSyllabi, setGeneratedSyllabi] = useState({});
  const [parseLog, setParseLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const log = msg => setParseLog(p => [msg, ...p].slice(0, 50));

  // Apply diagnostic result to mix modules
  const applyDiag = (result) => {
    const {rec} = result;
    const required = mixModules.filter(m=>m.requirement==="必修");
    const elective = mixModules.filter(m=>m.requirement!=="必修");
    const sorted = [...required,...elective];
    const typeMap = {};
    let cnt = {short:0, credit1:0, credit2:0};
    sorted.forEach(m=>{
      if(cnt.credit2<rec.credit2){typeMap[m.module_id]="credit2";cnt.credit2++;}
      else if(cnt.credit1<rec.credit1){typeMap[m.module_id]="credit1";cnt.credit1++;}
      else{typeMap[m.module_id]="short";cnt.short++;}
    });
    setMixModules(prev=>prev.map(m=>({...m,_session_type:typeMap[m.module_id]||"credit2"})));
    log(`✅ 診断適用: 授業${rec.short}・1単位${rec.credit1}・2単位${rec.credit2}科目`);
  };

  const handleDiagComplete = (result) => {
    setDiagResult(result);
    applyDiag(result);
    setStep(2);
  };

  const handleImportComplete = () => {
    // Merge imported modules into mix (imported are added with credit2 default, avoid duplicates)
    const existingIds = new Set(mixModules.map(m=>m.module_id));
    const newMods = importedModules.filter(m=>!existingIds.has(m.module_id)).map(m=>({...m,_session_type:"credit2"}));
    if(newMods.length>0){
      setMixModules(prev=>[...prev,...newMods]);
      log(`✅ ${newMods.length}科目をミックスに追加`);
    }
    setStep(3);
  };

  // Step indicator
  const STEPS = [
    {n:1, label:"問診診断",    icon:"🩺", done:!!diagResult},
    {n:2, label:"シラバス取込",icon:"📂", done:step>2},
    {n:3, label:"ミックス＆生成",icon:"✨", done:false},
  ];

  return (
    <div className="bg-white text-gray-900 font-sans flex flex-col" style={{height:"100vh",overflow:"hidden"}}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center gap-4 shrink-0">
        <div className="mr-2">
          <h1 className="text-sm font-bold"><span className="text-violet-600">GSL48</span> シラバス構築ツール</h1>
          <p className="text-xs text-gray-400">Smart Life University</p>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1 flex-1">
          {STEPS.map((s,i)=>(
            <div key={s.n} className="flex items-center gap-1">
              <button onClick={()=>setStep(s.n)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${step===s.n?"bg-violet-600 text-white shadow-lg shadow-violet-200/40":s.done?"bg-gray-200 text-emerald-600 hover:bg-gray-300":"bg-gray-200 text-gray-400 hover:bg-gray-100"}`}>
                <span>{s.done&&step!==s.n?"✅":s.icon}</span>
                <span>STEP {s.n}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i<STEPS.length-1&&<span className="text-gray-400 text-sm">›</span>}
            </div>
          ))}
        </div>
        {/* Log toggle */}
        <button onClick={()=>setShowLog(v=>!v)}
          className="text-xs text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
          📋 ログ{parseLog.length>0&&<span className="bg-violet-600 text-white text-xs px-1 rounded-full">{parseLog.length}</span>}
        </button>
      </div>

      {/* Log drawer */}
      {showLog&&(
        <div className="border-b border-gray-200 bg-white/95 px-4 py-2 max-h-28 overflow-y-auto shrink-0">
          {parseLog.length===0?<p className="text-xs text-gray-400">ログなし</p>
            :parseLog.map((l,i)=><p key={i} className="text-xs text-gray-500 leading-tight">{l}</p>)}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex flex-col min-h-0">
        {step===1&&<Step1Diag onComplete={handleDiagComplete}/>}
        {step===2&&<Step2Import importedModules={importedModules} setImportedModules={setImportedModules} onComplete={handleImportComplete} log={log}/>}
        {step===3&&(
          <Step3Mix
            mixModules={mixModules} setMixModules={setMixModules}
            gslModules={GSL_DATA.modules} importedModules={importedModules}
            generatedSyllabi={generatedSyllabi} setGeneratedSyllabi={setGeneratedSyllabi}
            diagResult={diagResult} log={log}
          />
        )}
      </div>
    </div>
  );
}
export default function Root() {
  return <PasswordGate><App /></PasswordGate>;
}
