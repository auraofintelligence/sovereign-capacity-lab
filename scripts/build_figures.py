from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
IMAGES=ROOT/'assets/images'
visuals=json.loads((ROOT/'data/visuals.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':13,'axes.titlesize':17,'axes.labelsize':13,'axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'#fffefa','axes.facecolor':'#fffefa','text.color':'#16332d','axes.labelcolor':'#16332d','xtick.color':'#16332d','ytick.color':'#16332d','axes.edgecolor':'#8ea69a','grid.color':'#d4ded1','savefig.facecolor':'#fffefa'})
green='#245c46';copper='#ae502a';gold='#d4ab52';blue='#397e96'
data={}
def save(fig,key,title,alt,caption):
 fig.tight_layout(pad=1.6)
 path=IMAGES/(key+'.png');fig.savefig(path,dpi=160,bbox_inches='tight');plt.close(fig)
 im=Image.open(path).convert('RGB');versions=[]
 for width in [768,1280,1774]:
  w=min(width,im.width)
  if versions and w==versions[-1]['width']:continue
  h=round(im.height*w/im.width);name=f'{key}-{w}.webp'
  im.resize((w,h),Image.Resampling.LANCZOS).save(IMAGES/name,'WEBP',quality=92,method=6)
  versions.append({'path':'assets/images/'+name,'width':w,'height':h})
 visuals[key]={'key':key,'type':'figure','title':title,'alt':alt,'caption':caption,'creator':'Sovereign Capacity Lab calculations prepared for Luke Nathan Hayes','date':'7 November 2026','license':'Strange But True Public Source Licence','license_url':'licence.html','source_url':'data/figure-data.json','method':'Matplotlib from the stated scenario inputs','variants':versions}

years=np.arange(2027,2037);annual=1e6*2.5**np.minimum(years-2027,4)*1.6**np.maximum(years-2031,0);cumulative=np.cumsum(annual)
fig,axes=plt.subplots(1,2,figsize=(11.5,4.8))
axes[0].bar(years,annual/1e6,color=copper,width=.7);axes[0].set(title='New robots manufactured each year',ylabel='Million machines per year',xlabel='Calendar year')
axes[1].plot(years,cumulative/1e6,color=green,linewidth=3,marker='o');axes[1].fill_between(years,cumulative/1e6,color=green,alpha=.1);axes[1].set(title='Equipment manufactured so far',ylabel='Million machines accumulated',xlabel='Calendar year')
for a in axes:a.set_xticks([2027,2029,2031,2033,2036]);a.grid(axis='y',alpha=.7);a.set_axisbelow(True)
axes[0].annotate('409.6 million',xy=(2036,409.6),xytext=(2030.4,370),arrowprops={'arrowstyle':'-','color':copper},color=copper,fontweight='bold')
axes[1].annotate('1,052.5 million',xy=(2036,cumulative[-1]/1e6),xytext=(2028.6,960),arrowprops={'arrowstyle':'-','color':green},color=green,fontweight='bold')
save(fig,'figure-production-fleet','Annual manufacture and accumulated equipment','Two plots show annual robot production reaching 409.6 million during 2036 and accumulated manufacture reaching about 1,052.5 million by that year.','The accelerated scenario makes 409.6 million new robots during 2036 and accumulates about 1.053 billion manufactured over 2027 to 2036. The operating fleet then deducts actual permanent retirements. Annual flow and accumulated equipment answer different questions.')
data['figure-production-fleet']={'year':years.tolist(),'annual_robots':annual.tolist(),'cumulative_manufactured_robots':cumulative.tolist(),'assumptions':'First annual manufacture 1 million in 2027; multiply by 2.5 annually to 2031, then by 1.6 annually to 2036. No permanent retirements deducted in the accumulated manufacturing plot.'}

fig,ax=plt.subplots(figsize=(11.5,3.6));left=0
for value,label,color in [(42,'42 kg retained',green),(2,'2 kg reconditioned',gold),(16,'16 kg newly supplied',copper)]:
 ax.barh([0],[value],left=left,color=color,height=.55,label=label)
 ax.text(left+value/2,0,f'{value}',ha='center',va='center',fontweight='bold',color='white' if value!=2 else '#16332d',fontsize=18);left+=value
ax.set_yticks([]);ax.set_xlim(0,60);ax.set_xlabel('Kilograms in the serviced 60 kg machine');ax.set_title('Refurbishment keeps the serviceable structure working',pad=20);ax.legend(loc='lower center',bbox_to_anchor=(.5,-.65),ncol=3,frameon=False);ax.spines[['left','bottom']].set_visible(False);ax.tick_params(bottom=False);fig.subplots_adjust(bottom=.34)
save(fig,'figure-repair-material','Retain repair and renew','A stacked mass bar shows 42 kilograms retained, two kilograms supplied through reconditioning and sixteen kilograms of new modules in a sixty kilogram serviced robot.','In the worked overhaul, a 60 kg robot retains 42 kg. Its 18 kg module allowance can include 2 kg of reconditioned parts and 16 kg of newly supplied material. One million such jobs therefore need 16,000 tonnes of new modules while retaining 42,000 tonnes of equipment.')
data['figure-repair-material']={'retained_kg':42,'reconditioned_kg':2,'new_kg':16,'complete_machine_kg':60,'service_jobs_example':1000000}

hour=np.arange(24);profile=np.maximum(0,np.sin(np.pi*(hour+.5-6)/12));profile[(hour<6)|(hour>=18)]=0;pv=profile/profile.sum()*24*.25*6
stored=10;rows=[]
for day in range(30):
 rows=[]
 for h,solar in enumerate(pv):
  net=solar-1;unserved=0
  if net>=0:stored+=min(net,(20-stored)/.95)*.95
  else:
   take=min(-net/.95,stored);stored-=take;unserved=-net-take*.95
  rows.append((int(h),float(solar),float(stored),float(unserved)))
fig,axes=plt.subplots(2,1,figsize=(11.5,6.4),sharex=True,gridspec_kw={'height_ratios':[1.25,1]})
axes[0].plot(hour,pv,color=gold,linewidth=3,label='Solar output');axes[0].axhline(1,color=copper,linewidth=2,label='Constant electricity load');axes[0].fill_between(hour,0,pv,color=gold,alpha=.17);axes[0].set(ylabel='Power in gigawatts',title='Solar output and stored energy serve different hours');axes[0].legend(frameon=False,ncol=2,loc='upper right')
axes[1].plot(hour,[v[2]for v in rows],color=green,linewidth=3);axes[1].fill_between(hour,0,[v[2]for v in rows],color=green,alpha=.13);axes[1].set(ylabel='Stored energy in GWh',xlabel='Hour of the illustrative day',ylim=(0,22),xticks=[0,4,8,12,16,20,23]);
for a in axes:a.grid(axis='y',alpha=.7)
save(fig,'figure-day-storage','Power during the day and stored energy overnight','The upper plot shows solar output peaking near midday against a constant one gigawatt load. The lower plot shows stored energy rising during daylight and falling overnight.','Illustrative repeated day: 6 GW of solar nameplate at 25 per cent capacity factor supplies a constant 1 GW load with 20 GWh of usable internal storage and 95 per cent efficiency in each direction. The plot separates instantaneous power from stored energy. Weather and seasonal adequacy need their own time series.')
data['figure-day-storage']={'assumptions':{'solar_gw':6,'capacity_factor':.25,'load_gw':1,'usable_internal_storage_gwh':20,'charge_efficiency':.95,'discharge_efficiency':.95},'hourly_columns':['hour','solar_gw','stored_gwh','unserved_gwh'],'rows':rows}

weights={'Cu':63.546,'Fe':55.845,'S':32.06,'Al':26.982,'O':15.999,'Li':6.94,'P':30.974}
recipes=[('Chalcopyrite\nCuFeS2',{'Cu':1,'Fe':1,'S':2}),('Alumina\nAl2O3',{'Al':2,'O':3}),('Battery active cathode\nLiFePO4',{'Li':1,'Fe':1,'P':1,'O':4})]
colors={'Cu':copper,'Fe':'#70857a','S':gold,'Al':'#6e99a8','O':'#b2c5bd','Li':'#7d6c9c','P':'#c57963'}
fig,ax=plt.subplots(figsize=(11.5,4.9));allfrac=[];seen=set()
for i,(name,atoms)in enumerate(recipes):
 mass=sum(weights[k]*v for k,v in atoms.items());left=0;frac={}
 for e,n in atoms.items():
  share=weights[e]*n/mass;frac[e]=share;ax.barh(i,share*100,left=left,color=colors[e],height=.55,label=e if e not in seen else None)
  if share>.06:ax.text(left+share*50,i,f'{e} {share*100:.1f}%',ha='center',va='center',fontsize=12,color='#102d24',fontweight='bold')
  left+=share*100;seen.add(e)
 allfrac.append({'formula':name.split('\n')[1],'elemental_mass_fractions':frac})
ax.set_yticks(range(3),[r[0]for r in recipes]);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xlabel('Elemental mass share in the pure compound');ax.set_title('Pure compounds contain several different elements',pad=18);ax.legend(loc='upper center',bbox_to_anchor=(.5,-.22),ncol=7,frameon=False);ax.spines['left'].set_visible(False);ax.tick_params(left=False)
save(fig,'figure-compound-elements','The elements inside source compounds','Stacked mass bars show the different elemental shares in chalcopyrite, alumina and lithium iron phosphate. Copper is about 34.6 per cent of pure chalcopyrite and aluminium about 52.9 per cent of pure alumina.','Chemical composition supplies one conversion. Ore grade supplies another. Recovery supplies a third. The feedstock calculator applies all three, so a compound, an ore and refined metal remain separate quantities.')
data['figure-compound-elements']=allfrac
(ROOT/'data/visuals.json').write_text(json.dumps(visuals,indent=2),encoding='utf-8')
(ROOT/'data/figure-data.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
print(json.dumps({'explanatory_figures':4,'total_visual_assets':len(visuals)}))
